import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Response } from 'express'
import type { AuthenticatedRequest } from '../types/auth.types'
import { AssistantError } from '../services/assistant.errors'
import type { AssistantErrorCode } from '../services/assistant.errors'

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

import { chat } from './assistant.controller'

function createResponse() {
    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })

    const res = { status } as unknown as Response

    return { res, status, json }
}

const summary = {
    generatedAt: '2026-10-26T14:00:00.000Z',
    balances: [{ currency: 'USD', amount: 25 }],
    recentTransactions: [],
}

describe('chat controller', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mocks.getAssistantFinancialSummary.mockResolvedValue(summary)
    })

    it('devuelve la respuesta del servicio con HTTP 200', async () => {
        mocks.getAssistantReply.mockResolvedValue('Puedes organizar tus gastos.')

        const req = {
            body: { message: '¿Cómo organizo mis gastos?' },
            user: {
                id: 'usuario-prueba',
                email: 'prueba@example.com',
            },
        } as AuthenticatedRequest

        const { res, status, json } = createResponse()

        await chat(req, res)

        expect(mocks.getAssistantFinancialSummary).toHaveBeenCalledWith(
            'usuario-prueba',
        )
        expect(mocks.getAssistantReply).toHaveBeenCalledWith(
            '¿Cómo organizo mis gastos?',
            summary,
        )
        expect(status).toHaveBeenCalledWith(200)
        expect(json).toHaveBeenCalledWith({
            reply: 'Puedes organizar tus gastos.',
        })
    })

    const errorCases: [AssistantErrorCode, number][] = [
        ['INVALID_MESSAGE', 400],
        ['CONFIGURATION_ERROR', 503],
        ['PROVIDER_ERROR', 502],
        ['EMPTY_RESPONSE', 502],
        ['TIMEOUT', 504],
    ]

    it.each(errorCases)(
        'convierte %s en HTTP %i',
        async (code, expectedStatus) => {
            mocks.getAssistantReply.mockRejectedValue(
                new AssistantError(code, 'Mensaje controlado'),
            )
            mocks.getAssistantFinancialSummary.mockResolvedValue(summary)

            const req = {
                body: { message: 'Hola' },
                user: {
                    id: 'usuario-prueba',
                    email: 'prueba@example.com',
                },
            } as AuthenticatedRequest
            const { res, status, json } = createResponse()

            await chat(req, res)

            expect(status).toHaveBeenCalledWith(expectedStatus)
            expect(json).toHaveBeenCalledWith({
                error: 'Mensaje controlado',
            })
        },
    )

    it('oculta los detalles de un error inesperado', async () => {
        mocks.getAssistantReply.mockRejectedValue(
            new Error('Detalle interno que no debe publicarse'),
        )

        const req = {
            body: { message: 'Hola' },
            user: {
                id: 'usuario-prueba',
                email: 'prueba@example.com',
            },
        } as AuthenticatedRequest
        const { res, status, json } = createResponse()

        await chat(req, res)

        expect(status).toHaveBeenCalledWith(500)
        expect(json).toHaveBeenCalledWith({
            error: 'No se pudo procesar el mensaje. Intenta más tarde.',
        })
    })


    it('rechaza una petición sin usuario autenticado sin llamar al servicio', async () => {
        const req = {
            body: {
                message: 'Hola',
                userId: 'otro-usuario',
            },
        } as AuthenticatedRequest

        const { res, status, json } = createResponse()

        await chat(req, res)

        expect(status).toHaveBeenCalledWith(401)
        expect(json).toHaveBeenCalledWith({
            error: 'Usuario no autenticado.',
        })
        expect(mocks.getAssistantReply).not.toHaveBeenCalled()
    })
    it('rechaza un mensaje vacío sin consultar el resumen ni Gemini', async () => {
        const req = {
            body: { message: '   ' },
            user: {
                id: 'usuario-prueba',
                email: 'prueba@example.com',
            },
        } as AuthenticatedRequest

        const { res, status, json } = createResponse()

        await chat(req, res)

        expect(status).toHaveBeenCalledWith(400)
        expect(json).toHaveBeenCalledWith({
            error: expect.any(String),
        })
        expect(mocks.getAssistantFinancialSummary).not.toHaveBeenCalled()
        expect(mocks.getAssistantReply).not.toHaveBeenCalled()
    })

    it('oculta un fallo del resumen y no llama a Gemini', async () => {
        mocks.getAssistantFinancialSummary.mockRejectedValue(
            new Error('Detalle interno de PostgreSQL'),
        )

        const req = {
            body: { message: '¿Cuál es mi saldo?' },
            user: {
                id: 'usuario-prueba',
                email: 'prueba@example.com',
            },
        } as AuthenticatedRequest

        const { res, status, json } = createResponse()

        await chat(req, res)

        expect(status).toHaveBeenCalledWith(500)
        expect(json).toHaveBeenCalledWith({
            error: 'No se pudo procesar el mensaje. Intenta más tarde.',
        })
        expect(mocks.getAssistantReply).not.toHaveBeenCalled()
    })

    it('usa la identidad autenticada e ignora los identificadores del cuerpo', async () => {
        mocks.getAssistantReply.mockResolvedValue('Tu saldo es de 25 USD.')

        const req = {
            body: {
                message: '¿Cuál es mi saldo?',
                userId: 'otro-usuario',
                walletId: 'otra-billetera',
            },
            user: {
                id: 'usuario-autenticado',
                email: 'prueba@example.com',
            },
        } as AuthenticatedRequest

        const { res, status } = createResponse()

        await chat(req, res)

        expect(mocks.getAssistantFinancialSummary).toHaveBeenCalledOnce()
        expect(mocks.getAssistantFinancialSummary).toHaveBeenCalledWith(
            'usuario-autenticado',
        )
        expect(mocks.getAssistantReply).toHaveBeenCalledWith(
            '¿Cuál es mi saldo?',
            summary,
        )
        expect(status).toHaveBeenCalledWith(200)
    })

})