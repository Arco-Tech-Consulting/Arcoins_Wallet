import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    generateContent: vi.fn(),
    constructor: vi.fn(),
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
    getGeminiConfig: () => ({
        apiKey: 'clave-ficticia',
        model: 'modelo-de-prueba',
        timeoutMs: 15000,
    }),
}))

import { getAssistantReply } from './assistant.service'

describe('getAssistantReply', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('envía el mensaje limpio y devuelve la respuesta limpia', async () => {
        mocks.generateContent.mockResolvedValue({
            text: '  Puedes organizar tus gastos por categorías.  ',
        })

        const reply = await getAssistantReply('  ¿Cómo organizo mis gastos?  ')

        expect(reply).toBe('Puedes organizar tus gastos por categorías.')

        expect(mocks.constructor).toHaveBeenCalledWith({
            apiKey: 'clave-ficticia',
            httpOptions: { timeout: 15000 },
        })

        expect(mocks.generateContent).toHaveBeenCalledOnce()
        expect(mocks.generateContent).toHaveBeenCalledWith({
            model: 'modelo-de-prueba',
            contents: '¿Cómo organizo mis gastos?',
            config: {
                systemInstruction: expect.any(String),
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

            await expect(getAssistantReply('Hola')).rejects.toThrow(
                'El asistente no devolvió una respuesta de texto.',
            )
        },
    )

    it('propaga un fallo del proveedor', async () => {
        mocks.generateContent.mockRejectedValue(
            new Error('Fallo simulado del proveedor'),
        )

        await expect(getAssistantReply('Hola')).rejects.toThrow(
            'Fallo simulado del proveedor',
        )
    })
})