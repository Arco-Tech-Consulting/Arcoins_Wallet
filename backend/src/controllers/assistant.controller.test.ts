import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
import { AssistantError } from '../services/assistant.errors'
import type { AssistantErrorCode } from '../services/assistant.errors'

const mocks = vi.hoisted(() => ({
    getAssistantReply: vi.fn(),
}))

vi.mock('../services/assistant.service', () => ({
    getAssistantReply: mocks.getAssistantReply,
}))

import { chat } from './assistant.controller'

function createResponse() {
    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })

    const res = { status } as unknown as Response

    return { res, status, json }
}

describe('chat controller', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('devuelve la respuesta del servicio con HTTP 200', async () => {
        mocks.getAssistantReply.mockResolvedValue('Puedes organizar tus gastos.')

        const req = {
            body: { message: '¿Cómo organizo mis gastos?' },
        } as Request

        const { res, status, json } = createResponse()

        await chat(req, res)

        expect(mocks.getAssistantReply).toHaveBeenCalledWith(
            '¿Cómo organizo mis gastos?',
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

            const req = { body: { message: 'Hola' } } as Request
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

        const req = { body: { message: 'Hola' } } as Request
        const { res, status, json } = createResponse()

        await chat(req, res)

        expect(status).toHaveBeenCalledWith(500)
        expect(json).toHaveBeenCalledWith({
            error: 'No se pudo procesar el mensaje. Intenta más tarde.',
        })
    })
})