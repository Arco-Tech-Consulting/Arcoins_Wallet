import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'

const mocks = vi.hoisted(() => ({
    getAssistantReply: vi.fn(),
    getAssistantFinancialSummary: vi.fn(),
}))

vi.mock('../services/assistant.service', () => ({
    getAssistantReply: mocks.getAssistantReply,
}))

vi.mock('../services/assistant.summary.service', () => ({
    getAssistantFinancialSummary: mocks.getAssistantFinancialSummary,
}))

import assistantRoutes from './assistant.routes'

const TEST_SECRET = 'clave-ficticia-exclusiva-para-pruebas'

const summary = {
    generatedAt: '2026-10-26T14:00:00.000Z',
    balances: [{ currency: 'USD', amount: 25 }],
    recentTransactions: [],
}

const app = express()
app.use(express.json())
app.use('/api', assistantRoutes)

describe('POST /api/chat', () => {
    it('bloquea el exceso antes de consultar saldos o Gemini', async () => {
        mocks.getAssistantReply.mockResolvedValue('Respuesta')
        const token = jwt.sign({ id: 'usuario-limite' }, TEST_SECRET, { expiresIn: '5m' })
        for (let i = 0; i < 10; i++) {
            const result = await request(app).post('/api/chat')
                .set('Authorization', `Bearer ${token}`).send({ message: 'Hola' })
            expect(result.status).toBe(200)
        }
        mocks.getAssistantFinancialSummary.mockClear()
        mocks.getAssistantReply.mockClear()
        const result = await request(app).post('/api/chat')
            .set('Authorization', `Bearer ${token}`).send({ message: 'Hola', userId: 'otro' })
        expect(result.status).toBe(429)
        expect(Number(result.headers['retry-after'])).toBeGreaterThan(0)
        expect(mocks.getAssistantFinancialSummary).not.toHaveBeenCalled()
        expect(mocks.getAssistantReply).not.toHaveBeenCalled()
    })
    beforeEach(() => {
        vi.resetAllMocks()
        vi.stubEnv('JWT_SECRET', TEST_SECRET)
        mocks.getAssistantFinancialSummary.mockResolvedValue(summary)
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('rechaza una petición sin token', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: 'Hola' })

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error')
        expect(mocks.getAssistantReply).not.toHaveBeenCalled()
        expect(mocks.getAssistantFinancialSummary).not.toHaveBeenCalled()
    })

    it('rechaza un token con firma incorrecta', async () => {
        const token = jwt.sign(
            { id: 'usuario-prueba', email: 'prueba@example.com' },
            'otra-clave-ficticia',
            { expiresIn: '5m' },
        )

        const response = await request(app)
            .post('/api/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ message: 'Hola' })

        expect(response.status).toBe(401)
        expect(mocks.getAssistantReply).not.toHaveBeenCalled()
        expect(mocks.getAssistantFinancialSummary).not.toHaveBeenCalled()
    })

    it('rechaza un token expirado', async () => {
        const token = jwt.sign(
            { id: 'usuario-prueba', email: 'prueba@example.com' },
            TEST_SECRET,
            { expiresIn: -60 },
        )

        const response = await request(app)
            .post('/api/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ message: 'Hola' })

        expect(response.status).toBe(401)
        expect(mocks.getAssistantReply).not.toHaveBeenCalled()
        expect(mocks.getAssistantFinancialSummary).not.toHaveBeenCalled()
    })

    it('permite acceder con un token válido', async () => {
        mocks.getAssistantReply.mockResolvedValue(
            'Puedes organizar tus gastos por categorías.',
        )

        const token = jwt.sign(
            { id: 'usuario-prueba', email: 'prueba@example.com' },
            TEST_SECRET,
            { expiresIn: '5m' },
        )

        const response = await request(app)
            .post('/api/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ message: '¿Cómo organizo mis gastos?' })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            reply: 'Puedes organizar tus gastos por categorías.',
        })
        expect(mocks.getAssistantFinancialSummary).toHaveBeenCalledExactlyOnceWith(
            'usuario-prueba',
        )
    })



})
