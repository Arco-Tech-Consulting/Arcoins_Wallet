import { timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getMailConfig } from '../src/config'
import { welcomeRepository } from '../src/repository'
import { sendWelcome } from '../src/sender'

type Request = IncomingMessage & { body?: unknown }
type Dependencies = { repository: typeof welcomeRepository; send: typeof sendWelcome }

export function createWelcomeHandler({ repository, send }: Dependencies) {
    return async (req: Request, res: ServerResponse): Promise<void> => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        const reply = (status: number, body: object) => {
            res.statusCode = status
            res.end(JSON.stringify(body))
        }
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST')
            reply(405, { error: 'Método no permitido.' })
            return
        }
        const secret = process.env.WELCOME_EMAIL_SECRET?.trim()
        if (!secret || secret.length < 32) {
            reply(503, { error: 'Servicio no configurado.' })
            return
        }
        const received = Buffer.from(req.headers.authorization || '')
        const expected = Buffer.from(`Bearer ${secret}`)
        if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
            reply(401, { error: 'No autorizado.' })
            return
        }
        const body = req.body
        if (typeof body !== 'object' || body === null || !('eventId' in body) ||
            typeof body.eventId !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(body.eventId) ||
            Object.keys(body).some((key) => key !== 'eventId')) {
            reply(400, { error: 'Evento inválido.' })
            return
        }
        const eventId = body.eventId
        let claimed = false
        try {
            const config = getMailConfig()
            const recipient = await repository.claim(eventId)
            if (!recipient) {
                const status = await repository.status(eventId)
                reply(status === 'sent' ? 200 : status === 'sending' ? 202 : status ? 409 : 404,
                    { status: status || 'not_found' })
                return
            }
            claimed = true
            const messageId = await send(recipient, config)
            await repository.sent(eventId, messageId)
            reply(200, { status: 'sent' })
        } catch {
            if (claimed) {
                try { await repository.uncertain(eventId) } catch { /* A stuck sending event requires review. */ }
            }
            console.warn('[welcome-email] Envío no confirmado; revisar estado del evento.')
            reply(503, { error: 'No se pudo confirmar el envío.' })
        }
    }
}

export default createWelcomeHandler({ repository: welcomeRepository, send: sendWelcome })
