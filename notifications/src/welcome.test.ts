import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createWelcomeHandler } from '../api/welcome'
import { getMailConfig } from './config'
import { welcomeTemplate } from './template'

const eventId = '12345678-1234-1234-1234-123456789012'
const secret = 'test-secret-with-at-least-32-characters'

describe('función de bienvenida', () => {
    const repository = { claim: vi.fn(), status: vi.fn(), sent: vi.fn(), uncertain: vi.fn() }
    const send = vi.fn()
    const handler = createWelcomeHandler({ repository, send })
    async function call(body: unknown = { eventId }, authorization = `Bearer ${secret}`, method = 'POST') {
        const res = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() }
        await handler({ method, headers: { authorization }, body } as unknown as IncomingMessage,
            res as unknown as ServerResponse)
        return res
    }
    beforeEach(() => {
        vi.resetAllMocks()
        vi.stubEnv('WELCOME_EMAIL_SECRET', secret)
        vi.stubEnv('AWS_REGION', 'us-east-1')
        vi.stubEnv('SES_FROM_EMAIL', 'welcome@example.com')
        vi.stubEnv('ARCOINS_APP_URL', 'https://arcoinswallet.vercel.app')
        repository.claim.mockResolvedValue('registered@example.com')
        send.mockResolvedValue('ses-message-1')
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })
    afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

    it('rechaza una llamada sin secreto antes de acceder a DB o SES', async () => {
        const res = await call({ eventId }, '')
        expect(res.statusCode).toBe(401)
        expect(repository.claim).not.toHaveBeenCalled()
        expect(send).not.toHaveBeenCalled()
    })
    it('rechaza métodos distintos a POST', async () => {
        expect((await call({ eventId }, `Bearer ${secret}`, 'GET')).statusCode).toBe(405)
        expect(repository.claim).not.toHaveBeenCalled()
    })
    it('rechaza destinatarios y campos adicionales elegidos en la petición', async () => {
        expect((await call({ eventId, email: 'attacker@example.com' })).statusCode).toBe(400)
        expect(repository.claim).not.toHaveBeenCalled()
    })
    it('rechaza un identificador inválido', async () => {
        expect((await call({ eventId: 'bad-id' })).statusCode).toBe(400)
    })
    it('envía solo al correo obtenido de la cuenta y guarda el ID de SES', async () => {
        expect((await call()).statusCode).toBe(200)
        expect(repository.claim).toHaveBeenCalledExactlyOnceWith(eventId)
        expect(send).toHaveBeenCalledExactlyOnceWith('registered@example.com', expect.objectContaining({ fromEmail: 'welcome@example.com' }))
        expect(repository.sent).toHaveBeenCalledWith(eventId, 'ses-message-1')
    })
    it.each([['sent', 200], ['sending', 202], ['uncertain', 409], [null, 404]])(
        'no duplica eventos en estado %s', async (status, code) => {
            repository.claim.mockResolvedValue(null)
            repository.status.mockResolvedValue(status)
            expect((await call()).statusCode).toBe(code)
            expect(send).not.toHaveBeenCalled()
        },
    )
    it('marca incertidumbre si SES falla y no publica el error interno', async () => {
        send.mockRejectedValue(new Error('secret@example.com'))
        const res = await call()
        expect(res.statusCode).toBe(503)
        expect(repository.uncertain).toHaveBeenCalledWith(eventId)
        expect(repository.sent).not.toHaveBeenCalled()
        expect(JSON.stringify(res.end.mock.calls)).not.toContain('secret@example.com')
    })
    it('no reenvía si falla guardar la respuesta de SES', async () => {
        repository.sent.mockRejectedValue(new Error('DB disconnected'))
        expect((await call()).statusCode).toBe(503)
        expect(send).toHaveBeenCalledOnce()
        expect(repository.uncertain).toHaveBeenCalledWith(eventId)
    })
    it('deja el evento pendiente si falta configuración antes del envío', async () => {
        vi.stubEnv('SES_FROM_EMAIL', '')
        expect((await call()).statusCode).toBe(503)
        expect(repository.claim).not.toHaveBeenCalled()
        expect(send).not.toHaveBeenCalled()
    })
})

describe('contenido de bienvenida', () => {
    it('produce HTML y texto informativos sin verificar cuentas', () => {
        const template = welcomeTemplate('https://example.com')
        expect(template.subject).toContain('Arcoins')
        expect(template.text).toContain('Tu cuenta se creó correctamente')
        expect(template.html).toContain('no verifica tu dirección')
        expect(template.html).not.toContain('token=')
    })
    it('no permite enlaces inseguros o credenciales en la URL de la app', () => {
        for (const url of ['http://example.com', 'javascript:alert(1)', 'https://user:password@example.com']) {
            expect(() => getMailConfig({ AWS_REGION: 'us-east-1', SES_FROM_EMAIL: 'a@example.com', ARCOINS_APP_URL: url })).toThrow()
        }
    })
})
