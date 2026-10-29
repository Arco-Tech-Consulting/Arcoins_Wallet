import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
const mocks = vi.hoisted(() => ({ register: vi.fn() }))
vi.mock('../services/auth.service', () => ({
    AuthService: class { register = mocks.register },
    AuthError: class extends Error {},
}))
import { AuthController } from './auth.controller'

describe('bienvenida después del registro', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        vi.stubEnv('WELCOME_EMAIL_ENABLED', 'true')
        vi.stubEnv('WELCOME_EMAIL_ENDPOINT', 'https://notifications.example.com/api/welcome')
        vi.stubEnv('WELCOME_EMAIL_SECRET', 's'.repeat(32))
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })
    afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
    it('mantiene HTTP 201 y el token si el correo falla', async () => {
        const result = { user: { id: 'u1', email: 'registered@example.com' }, token: 'jwt-test' }
        mocks.register.mockResolvedValue(result)
        const fetchMock = vi.fn().mockRejectedValue(new Error('SES down'))
        vi.stubGlobal('fetch', fetchMock)
        const res = { status: vi.fn(), json: vi.fn() }
        res.status.mockReturnValue(res)
        await new AuthController().register({ body: { email: 'different@example.com' } } as Request, res as unknown as Response)
        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith(result)
        expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ body: '{"eventId":"u1"}' }))
    })
    it('no solicita correo si falla el registro', async () => {
        mocks.register.mockRejectedValue(new Error('DB failed'))
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        const res = { status: vi.fn(), json: vi.fn() }
        res.status.mockReturnValue(res)
        await new AuthController().register({ body: {} } as Request, res as unknown as Response)
        expect(fetchMock).not.toHaveBeenCalled()
    })
})
