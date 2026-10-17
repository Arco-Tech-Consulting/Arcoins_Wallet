import { describe, it, expect } from 'vitest'
import { validateAssistantMessage } from './assistant.validation'
import { AssistantError } from './assistant.errors'

describe('validateAssistantMessage', () => {
    it('elimina espacios de los extremos', () => {
        expect(validateAssistantMessage('  Hola  ')).toBe('Hola')
    })

    it('conserva los espacios internos del mensaje', () => {
        expect(validateAssistantMessage('Quiero ahorrar dinero'))
            .toBe('Quiero ahorrar dinero')
    })

    it.each([123, null, undefined, true, {}, []])(
        'rechaza valores que no son texto: %j',
        (value) => {
            expect(() => validateAssistantMessage(value)).toThrow()
        },
    )

    it.each(['', '   ', '\n\t'])(
        'rechaza mensajes vacíos o con espacios: %j',
        (value) => {
            expect(() => validateAssistantMessage(value)).toThrow()
        },
    )

    it('acepta un mensaje de exactamente 2000 caracteres', () => {
        const message = 'a'.repeat(2000)

        expect(validateAssistantMessage(message)).toBe(message)
    })

    it('rechaza un mensaje de 2001 caracteres', () => {
        const message = 'a'.repeat(2001)

        expect(() => validateAssistantMessage(message)).toThrow()
    })

    it('comprueba el límite después de quitar espacios externos', () => {
        const message = 'a'.repeat(2000)

        expect(validateAssistantMessage(`  ${message}  `)).toBe(message)
    })

    it('identifica el mensaje inválido con un error controlado', () => {
        const validate = () => validateAssistantMessage('   ')

        expect(validate).toThrow(AssistantError)
        expect(validate).toThrow(
            expect.objectContaining({
                code: 'INVALID_MESSAGE',
            }),
        )
    })
})