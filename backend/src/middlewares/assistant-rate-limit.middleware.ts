import type { NextFunction, Response } from 'express'
import type { AuthenticatedRequest } from '../types/auth.types'

// Per-process protection. Multiple replicas require a shared store.
export function createAssistantRateLimiter() {
    const windowMs = 60_000
    const maxRequests = 10
    const maxUsers = 10_000
    const users = new Map<string, { count: number; resetAt: number }>()

    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        const userId = req.user?.id
        if (typeof userId !== 'string' || !userId.trim()) {
            res.status(401).json({ error: 'Usuario no autenticado.' })
            return
        }

        const now = Date.now()
        for (const [id, entry] of users) {
            if (entry.resetAt <= now) users.delete(id)
        }

        let entry = users.get(userId)
        if (!entry && users.size >= maxUsers) {
            res.setHeader('Retry-After', '60')
            res.status(503).json({ error: 'El asistente está ocupado. Intenta en un minuto.' })
            return
        }
        if (!entry) {
            entry = { count: 0, resetAt: now + windowMs }
            users.set(userId, entry)
        }

        if (entry.count >= maxRequests) {
            const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
            res.setHeader('Retry-After', String(retryAfterSeconds))
            res.status(429).json({
                error: 'Alcanzaste el límite de mensajes. Espera antes de reintentar.',
                retryAfterSeconds,
            })
            return
        }

        entry.count += 1
        next()
    }
}
