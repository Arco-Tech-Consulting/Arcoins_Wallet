import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestWelcomeEmail } from './welcome-email.service'

describe('solicitud de bienvenida', () => {
    const fetchMock = vi.fn()
    beforeEach(() => {
        vi.stubGlobal('fetch', fetchMock)
        fetchMock.mockReset()
        vi.stubEnv('WELCOME_EMAIL_ENABLED', 'true')
        vi.stubEnv('WELCOME_EMAIL_ENDPOINT', 'https://notifications.example.com/api/welcome')
        vi.stubEnv('WELCOME_EMAIL_SECRET', 'x'.repeat(32))
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })
    afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks() })

    it('envía solo el evento persistido con autorización de servidor', async () => {
        fetchMock.mockResolvedValue({ ok: true })
        expect(await requestWelcomeEmail('usuario-1')).toBe(true)
        expect(fetchMock).toHaveBeenCalledWith(new URL('https://notifications.example.com/api/welcome'),
            expect.objectContaining({
                body: JSON.stringify({ eventId: 'usuario-1' }),
                redirect: 'error',
                headers: { Authorization: `Bearer ${'x'.repeat(32)}`, 'Content-Type': 'application/json' },
            }))
    })
    it('no llama a la función si está deshabilitado', async () => {
        vi.stubEnv('WELCOME_EMAIL_ENABLED', 'false')
        expect(await requestWelcomeEmail('u')).toBe(false)
        expect(fetchMock).not.toHaveBeenCalled()
    })
    it('no propaga fallos ni expone secretos en logs', async () => {
        fetchMock.mockRejectedValue(new Error('secreto-correo@example.com'))
        expect(await requestWelcomeEmail('u')).toBe(false)
        expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('secreto-correo')
    })
    it('rechaza endpoints sin HTTPS antes de enviar el secreto', async () => {
        vi.stubEnv('WELCOME_EMAIL_ENDPOINT', 'http://example.com/api/welcome')
        expect(await requestWelcomeEmail('u')).toBe(false)
        expect(fetchMock).not.toHaveBeenCalled()
    })
    it('registra como no confirmado un rechazo de la función', async () => {
        fetchMock.mockResolvedValue({ ok: false })
        expect(await requestWelcomeEmail('u')).toBe(false)
    })
})
