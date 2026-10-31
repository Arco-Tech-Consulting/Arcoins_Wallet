import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    generateContent: vi.fn(),
    constructor: vi.fn(),
    getGeminiConfig: vi.fn(),
}))

vi.mock('@google/genai', () => ({
    GoogleGenAI: class {
        constructor(options: unknown) {
            mocks.constructor(options)
        }

        models = {
            generateContent: mocks.generateContent,
        }
    },
}))

vi.mock('../config/gemini.config', () => ({
    getGeminiConfig: mocks.getGeminiConfig,
}))

import { getAssistantReply } from './assistant.service'

describe('getAssistantReply', () => {
    beforeEach(() => {
        vi.resetAllMocks()

        mocks.getGeminiConfig.mockReturnValue({
            apiKey: 'clave-ficticia',
            model: 'modelo-de-prueba',
            timeoutMs: 15000,
        })
    })

    it('envía el mensaje limpio y devuelve la respuesta limpia', async () => {
        mocks.generateContent.mockResolvedValue({
            text: '  Puedes organizar tus gastos por categorías.  ',
        })

        const reply = await getAssistantReply('  ¿Cómo organizo mis gastos?  ')

        expect(reply).toBe('Puedes organizar tus gastos por categorías.')

        expect(mocks.constructor).toHaveBeenCalledWith({
            apiKey: 'clave-ficticia',
            httpOptions: { timeout: 15000, retryOptions: { attempts: 1 } },
        })

        expect(mocks.generateContent).toHaveBeenCalledOnce()
        expect(mocks.generateContent).toHaveBeenCalledWith({
            model: 'modelo-de-prueba',
            contents: '¿Cómo organizo mis gastos?',
            config: {
                systemInstruction: expect.any(String),
                abortSignal: expect.any(AbortSignal),
            },
        })
    })

    it('rechaza un mensaje inválido sin llamar al proveedor', async () => {
        await expect(getAssistantReply('   ')).rejects.toThrow()

        expect(mocks.constructor).not.toHaveBeenCalled()
        expect(mocks.generateContent).not.toHaveBeenCalled()
    })

    it.each([undefined, '', '   '])(
        'rechaza una respuesta sin texto útil: %j',
        async (text) => {
            mocks.generateContent.mockResolvedValue({ text })

            await expect(getAssistantReply('Hola')).rejects.toMatchObject({
                name: 'AssistantError',
                code: 'EMPTY_RESPONSE',
                message: 'El asistente no devolvió una respuesta de texto.',
            })
        },
    )

    it('oculta el error interno del proveedor', async () => {
        mocks.generateContent.mockRejectedValue(
            new Error('Detalle interno que no debe llegar al usuario'),
        )

        await expect(getAssistantReply('Hola')).rejects.toMatchObject({
            name: 'AssistantError',
            code: 'PROVIDER_ERROR',
            message: 'El asistente no está disponible. Intenta más tarde.',
        })
    })

    it('controla los errores de configuración sin llamar a Gemini', async () => {
        mocks.getGeminiConfig.mockImplementationOnce(() => {
            throw new Error('Detalle interno de configuración')
        })

        await expect(getAssistantReply('Hola')).rejects.toMatchObject({
            name: 'AssistantError',
            code: 'CONFIGURATION_ERROR',
            message:
                'El asistente no está disponible por un problema de configuración.',
        })

        expect(mocks.constructor).not.toHaveBeenCalled()
        expect(mocks.generateContent).not.toHaveBeenCalled()
    })

    it('identifica el tiempo de espera agotado', async () => {
        const error = new Error('Detalle interno del SDK')
        error.name = 'APIConnectionTimeoutError'

        mocks.generateContent.mockRejectedValue(error)

        await expect(getAssistantReply('Hola')).rejects.toMatchObject({
            name: 'AssistantError',
            code: 'TIMEOUT',
            message:
                'El asistente tardó demasiado en responder. Intenta nuevamente.',
        })
    })

    it('no confunde una cancelación con un tiempo de espera agotado', async () => {
        const error = new Error('Cancelación simulada')
        error.name = 'APIUserAbortError'

        mocks.generateContent.mockRejectedValue(error)

        await expect(getAssistantReply('Hola')).rejects.toMatchObject({
            code: 'PROVIDER_ERROR',
        })
    })

    it('envía el mensaje y el resumen financiero a Gemini', async () => {
        mocks.generateContent.mockResolvedValue({
            text: 'Tu saldo registrado es de 25 USD.',
        })

        const summary = {
            generatedAt: '2026-10-26T14:00:00.000Z',
            balances: [
                { currency: 'USD', amount: 25 },
            ],
            recentTransactions: [],
        }

        const reply = await getAssistantReply(
            '  ¿Cuál es mi saldo?  ',
            summary,
        )

        expect(mocks.generateContent).toHaveBeenCalledOnce()
        expect(mocks.generateContent).toHaveBeenCalledWith({
            model: 'modelo-de-prueba',
            contents: JSON.stringify({
                message: '¿Cuál es mi saldo?',
                financialSummary: summary,
            }),
            config: {
                systemInstruction: expect.any(String),
                abortSignal: expect.any(AbortSignal),
            },
        })

        expect(reply).toBe('Tu saldo registrado es de 25 USD.')
    })
})
describe('modelos de respaldo', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mocks.getGeminiConfig.mockReturnValue({ apiKey: 'test', model: 'principal',
            fallbackModels: ['respaldo', 'ultimo'], timeoutMs: 1000 })
    })
    afterEach(() => vi.useRealTimers())
    it.each([404, 408, 500, 503])('usa el respaldo tras HTTP %i y conserva el contexto', async (status) => {
        mocks.generateContent.mockRejectedValueOnce(Object.assign(new Error('privado'), { status }))
            .mockResolvedValueOnce({ text: 'Respuesta alternativa' })
        const summary = { generatedAt: '2026-10-31', balances: [], recentTransactions: [] }
        expect(await getAssistantReply('Hola', summary)).toBe('Respuesta alternativa')
        expect(mocks.generateContent.mock.calls.map(([arg]) => arg.model)).toEqual(['principal', 'respaldo'])
        expect(mocks.generateContent.mock.calls[1][0].contents).toBe(mocks.generateContent.mock.calls[0][0].contents)
    })
    it.each([400, 401, 403, 429])('no cambia modelo tras HTTP %i', async (status) => {
        mocks.generateContent.mockRejectedValue(Object.assign(new Error('privado'), { status }))
        await expect(getAssistantReply('Hola')).rejects.toMatchObject({ code: 'PROVIDER_ERROR' })
        expect(mocks.generateContent).toHaveBeenCalledTimes(1)
    })
    it('no llama respaldos cuando el principal funciona', async () => {
        mocks.generateContent.mockResolvedValue({ text: 'Listo' })
        expect(await getAssistantReply('Hola')).toBe('Listo')
        expect(mocks.generateContent).toHaveBeenCalledTimes(1)
    })
    it('no cambia modelo ante una respuesta vacía', async () => {
        mocks.generateContent.mockResolvedValue({ text: '' })
        await expect(getAssistantReply('Hola')).rejects.toMatchObject({ code: 'EMPTY_RESPONSE' })
        expect(mocks.generateContent).toHaveBeenCalledTimes(1)
    })
    it('termina después de agotar todos los modelos', async () => {
        mocks.generateContent.mockRejectedValue(Object.assign(new Error('privado'), { status: 503 }))
        await expect(getAssistantReply('Hola')).rejects.toMatchObject({ code: 'PROVIDER_ERROR' })
        expect(mocks.generateContent).toHaveBeenCalledTimes(3)
    })
    it('cancela un intento lento y pasa al respaldo', async () => {
        vi.useFakeTimers()
        mocks.generateContent.mockImplementationOnce(() => new Promise(() => {}))
            .mockResolvedValueOnce({ text: 'Respuesta alternativa' })
        const result = getAssistantReply('Hola')
        await vi.advanceTimersByTimeAsync(1000)
        expect(await result).toBe('Respuesta alternativa')
        expect(mocks.generateContent.mock.calls[0][0].config.abortSignal.aborted).toBe(true)
        expect(vi.getTimerCount()).toBe(0)
    })
})
