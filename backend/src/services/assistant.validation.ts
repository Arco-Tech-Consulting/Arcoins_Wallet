import { AssistantError } from './assistant.errors'

export function validateAssistantMessage(value: unknown): string {
    if (
        typeof value !== 'string' ||
        value.trim().length === 0 ||
        value.trim().length > 2000
    ) {
        throw new AssistantError(
            'INVALID_MESSAGE',
            'El mensaje debe ser texto, no puede estar vacío y no puede exceder 2000 caracteres.',
        )
    }

    return value.trim()
}