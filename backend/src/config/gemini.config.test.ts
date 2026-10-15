import { describe, it, expect } from 'vitest'
import { getGeminiConfig } from './gemini.config'

describe('getGeminiConfig', () => {
    const validEnv = {
        GEMINI_API_KEY: 'clave-ficticia-para-pruebas',
        GEMINI_MODEL: 'modelo-de-prueba',
        GEMINI_TIMEOUT_MS: '15000',
    }

    it('lee la configuración y convierte el tiempo a número', () => {
        expect(getGeminiConfig(validEnv)).toEqual({
            apiKey: 'clave-ficticia-para-pruebas',
            model: 'modelo-de-prueba',
            timeoutMs: 15000,
        })
    })

    it('elimina espacios externos de la clave y el modelo', () => {
        const config = getGeminiConfig({
            ...validEnv,
            GEMINI_API_KEY: '  clave-ficticia  ',
            GEMINI_MODEL: '  modelo-de-prueba  ',
        })

        expect(config.apiKey).toBe('clave-ficticia')
        expect(config.model).toBe('modelo-de-prueba')
    })

    it('usa 15000 ms cuando no se configura el tiempo', () => {
        const config = getGeminiConfig({
            GEMINI_API_KEY: validEnv.GEMINI_API_KEY,
            GEMINI_MODEL: validEnv.GEMINI_MODEL,
        })

        expect(config.timeoutMs).toBe(15000)
    })

    it.each([undefined, '', '   '])(
        'rechaza una clave ausente o vacía: %j',
        (apiKey) => {
            expect(() =>
                getGeminiConfig({ ...validEnv, GEMINI_API_KEY: apiKey }),
            ).toThrow('Falta configurar GEMINI_API_KEY.')
        },
    )

    it.each([undefined, '', '   '])(
        'rechaza un modelo ausente o vacío: %j',
        (model) => {
            expect(() =>
                getGeminiConfig({ ...validEnv, GEMINI_MODEL: model }),
            ).toThrow('Falta configurar GEMINI_MODEL.')
        },
    )

    it.each(['0', '-1', '1.5', 'abc', '', '   ', 'Infinity'])(
        'rechaza un tiempo inválido: %j',
        (timeout) => {
            expect(() =>
                getGeminiConfig({ ...validEnv, GEMINI_TIMEOUT_MS: timeout }),
            ).toThrow('GEMINI_TIMEOUT_MS debe ser un entero positivo.')
        },
    )
})