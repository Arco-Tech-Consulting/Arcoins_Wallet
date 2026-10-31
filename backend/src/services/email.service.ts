import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import type { QueryConfig } from 'pg'
import { waitForEmailSlot } from './email.pacing'
import { pool } from '../config/db'
import { welcomeTemplate, transactionTemplate } from './email.templates'

const TIMEOUT_MS = 5000
// pg supports per-query timeouts at runtime; its QueryConfig type omits this field.
function mailQuery(text: string, values: string[]) {
    const query: QueryConfig & { query_timeout: number } = { text, values, query_timeout: 3000 }
    return pool.query(query)
}
const emailPattern = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/
type Mail = { to: string; subject: string; text: string; html: string }

// Only known error names are logged; never provider messages or arbitrary fields.
const diagnosticNames = new Set([
    'AccessDeniedException', 'AccessDenied', 'MessageRejected',
    'MailFromDomainNotVerifiedException', 'TooManyRequestsException',
    'AccountSuspendedException', 'SendingPausedException',
    'CredentialsProviderError', 'InvalidClientTokenId', 'UnrecognizedClientException',
    'SignatureDoesNotMatch', 'ExpiredToken', 'ExpiredTokenException',
    'TimeoutError', 'AbortError',
])
function diagnosticReason(error: unknown): string {
    if (!(error instanceof Error)) return 'UNKNOWN_ERROR'
    if (error.name === 'MessageRejected' && /not verified/i.test(error.message)) {
        return 'IDENTITY_NOT_VERIFIED'
    }
    return diagnosticNames.has(error.name) ? error.name : 'UNKNOWN_ERROR'
}

// Best effort, one attempt, after COMMIT. Never rejects into a business operation.
async function deliver(kind: 'welcome' | 'transaction', load: (appUrl: string) => Promise<Mail | null>): Promise<boolean> {
    const enabled = kind === 'welcome' ? process.env.WELCOME_EMAIL_ENABLED : process.env.TRANSACTION_EMAIL_ENABLED
    if (enabled !== 'true') return false
    const abort = new AbortController()
    let client: SESv2Client | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let stage = 'configuration'
    let timedOut = false
    try {
        const region = process.env.AWS_REGION?.trim()
        const from = process.env.SES_FROM_EMAIL?.trim()
        const url = new URL(process.env.ARCOINS_APP_URL || '')
        if (!region || !from || !emailPattern.test(from) || url.protocol !== 'https:' || url.username || url.password) {
            throw new Error('Mail configuration invalid')
        }
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
                timedOut = true
                abort.abort()
                reject(new Error('Mail timeout'))
            }, TIMEOUT_MS)
        })
        const attempt = async () => {
            stage = 'load_message'
            const mail = await load(url.origin)
            // A DB lookup finishing after the deadline must never start a late send.
            if (abort.signal.aborted) throw new Error('Mail timeout')
            if (!mail) return false
            stage = 'recipient_validation'
            if (!emailPattern.test(mail.to)) throw new Error('Invalid recipient')
            stage = 'pacing'
            await waitForEmailSlot(abort.signal)
            abort.signal.throwIfAborted()
            stage = 'ses_send'
            client = new SESv2Client({ region, maxAttempts: 1 })
            const response = await client.send(new SendEmailCommand({
                FromEmailAddress: from,
                Destination: { ToAddresses: [mail.to] },
                Content: { Simple: {
                    Subject: { Data: mail.subject, Charset: 'UTF-8' },
                    Body: { Text: { Data: mail.text, Charset: 'UTF-8' }, Html: { Data: mail.html, Charset: 'UTF-8' } },
                } },
            }), { abortSignal: abort.signal })
            stage = 'ses_confirmation'
            if (!response.MessageId) throw new Error('No acceptance confirmation')
            console.info('[email] SES aceptó el correo', { kind })
            return true
        }
        return await Promise.race([attempt(), timeout])
    } catch (error: unknown) {
        // No recipient, credentials, content or provider error bodies in logs.
        console.warn('[email] Envío no confirmado; la operación sigue guardada.', {
            kind, stage, reason: timedOut ? 'TIMEOUT' : diagnosticReason(error),
        })
        return false
    } finally {
        if (timer !== undefined) clearTimeout(timer)
        client?.destroy()
    }
}

export function requestWelcomeEmail(userId: string): Promise<boolean> {
    return deliver('welcome', async (appUrl) => {
        const result = await mailQuery('SELECT email FROM users WHERE id = $1', [userId])
        const user = result.rows[0]
        return user ? { to: user.email, ...welcomeTemplate(appUrl) } : null
    })
}

export function requestTransactionEmail(userId: string, transactionId: string): Promise<boolean> {
    return deliver('transaction', async (appUrl) => {
        const result = await mailQuery(`SELECT t.*, u.email FROM transactions t
                JOIN users u ON u.id = t.user_id
                WHERE t.id = $1 AND t.user_id = $2 AND t.status = 'completed'`,
            [transactionId, userId],
        )
        const row = result.rows[0]
        return row ? { to: row.email, ...transactionTemplate(row, appUrl) } : null
    })
}
