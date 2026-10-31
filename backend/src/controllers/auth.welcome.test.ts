import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
const mocks = vi.hoisted(() => ({ register: vi.fn(), mail: vi.fn() }))
vi.mock('../services/auth.service', () => ({
    AuthService: class { register = mocks.register }, AuthError: class extends Error {},
}))
vi.mock('../services/email.service', () => ({ requestWelcomeEmail: mocks.mail }))
import { AuthController } from './auth.controller'
function response() {
    const res = { status: vi.fn(), json: vi.fn() }
    res.status.mockReturnValue(res)
    return res
}
describe('bienvenida después del registro', () => {
    beforeEach(() => vi.resetAllMocks())
    it('usa el usuario guardado y conserva HTTP 201 cuando el envío no se confirma', async () => {
        const result = { user: { id: 'u1', email: 'saved@example.com' }, token: 'jwt-test' }
        mocks.register.mockResolvedValue(result)
        mocks.mail.mockResolvedValue(false)
        const res = response()
        await new AuthController().register({ body: { email: 'other@example.com', userId: 'u2' } } as Request, res as unknown as Response)
        expect(mocks.mail).toHaveBeenCalledExactlyOnceWith('u1')
        expect(mocks.register.mock.invocationCallOrder[0]).toBeLessThan(mocks.mail.mock.invocationCallOrder[0])
        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith(result)
    })
    it('no envía al fallar el registro', async () => {
        mocks.register.mockRejectedValue(new Error('DB failed'))
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const res = response()
        await new AuthController().register({ body: {} } as Request, res as unknown as Response)
        expect(mocks.mail).not.toHaveBeenCalled()
        spy.mockRestore()
    })
})
