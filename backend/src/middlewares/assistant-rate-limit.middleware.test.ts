import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Response } from 'express'
import type { AuthenticatedRequest } from '../types/auth.types'
import { createAssistantRateLimiter } from './assistant-rate-limit.middleware'

function response() {
    const res = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() }
    res.status.mockReturnValue(res)
    return res
}

describe('límite del asistente por usuario', () => {
    afterEach(() => vi.restoreAllMocks())

    it('permite diez peticiones y bloquea la siguiente; ignora el userId del cuerpo', () => {
        const limiter = createAssistantRateLimiter()
        const req = { user: { id: 'uno' }, body: {} } as AuthenticatedRequest
        const res = response()
        const next = vi.fn()
        vi.spyOn(Date, 'now').mockReturnValue(1000)
        for (let i = 0; i < 11; i++) {
            req.body = { userId: String(i) }
            limiter(req, res as unknown as Response, next)
        }
        expect(next).toHaveBeenCalledTimes(10)
        expect(res.status).toHaveBeenCalledWith(429)
        expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '60')
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ retryAfterSeconds: 60 }))
    })

    it('separa usuarios y renueva la ventana sin prolongarla con rechazos', () => {
        const limiter = createAssistantRateLimiter()
        const res = response()
        const next = vi.fn()
        const clock = vi.spyOn(Date, 'now').mockReturnValue(0)
        const req = { user: { id: 'uno' } } as AuthenticatedRequest
        for (let i = 0; i < 10; i++) limiter(req, res as unknown as Response, next)
        clock.mockReturnValue(59_001)
        limiter(req, res as unknown as Response, next)
        expect(res.setHeader).toHaveBeenLastCalledWith('Retry-After', '1')
        limiter({ user: { id: 'dos' } } as AuthenticatedRequest, res as unknown as Response, next)
        expect(next).toHaveBeenCalledTimes(11)
        clock.mockReturnValue(60_000)
        limiter(req, res as unknown as Response, next)
        expect(next).toHaveBeenCalledTimes(12)
    })

    it('no acepta identidad enviada en el cuerpo sin autenticación', () => {
        const res = response()
        const next = vi.fn()
        createAssistantRateLimiter()({ body: { userId: 'otro' } } as AuthenticatedRequest, res as unknown as Response, next)
        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })
})
