import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { getMailConfig } from './config'
import { welcomeTemplate } from './template'

export async function sendWelcome(recipient: string, config: ReturnType<typeof getMailConfig>) {
    const template = welcomeTemplate(config.appUrl)
    // SES SendEmail is not idempotent: never retry automatically after an uncertain response.
    const client = new SESv2Client({ region: config.region, maxAttempts: 1 })
    try {
        const result = await client.send(new SendEmailCommand({
            FromEmailAddress: config.fromEmail,
            Destination: { ToAddresses: [recipient] },
            Content: {
                Simple: {
                    Subject: { Data: template.subject, Charset: 'UTF-8' },
                    Body: {
                        Text: { Data: template.text, Charset: 'UTF-8' },
                        Html: { Data: template.html, Charset: 'UTF-8' },
                    },
                },
            },
        }), { abortSignal: AbortSignal.timeout(8000) })
        if (!result.MessageId) throw new Error('Missing SES message ID')
        return result.MessageId
    } finally {
        client.destroy()
    }
}
