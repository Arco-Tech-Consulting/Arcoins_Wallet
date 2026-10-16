import { GoogleGenAI } from '@google/genai'
import { getGeminiConfig } from '../config/gemini.config'
import { validateAssistantMessage } from './assistant.validation'
import { AssistantError } from './assistant.errors'

const SYSTEM_INSTRUCTION = `
Eres el asistente educativo de Arcoins Wallet.
Responde en español, de forma clara y breve.
Ayuda con conceptos de billeteras digitales, ahorro y organización de gastos.
No tienes acceso a saldos, movimientos ni datos reales del usuario.
No inventes información sobre su cuenta.
No puedes ejecutar transferencias, depósitos ni pagos.
No solicites contraseñas, tokens ni claves.
`

export async function getAssistantReply(value: unknown): Promise<string> {
    const message = validateAssistantMessage(value)
    let config: ReturnType<typeof getGeminiConfig>

    try {
        config = getGeminiConfig()
    } catch {
        throw new AssistantError(
            'CONFIGURATION_ERROR',
            'El asistente no está disponible por un problema de configuración.',
        )
    }

    const client = new GoogleGenAI({
        apiKey: config.apiKey,
        httpOptions: {
            timeout: config.timeoutMs,
        },
    })

    const response = await client.models.generateContent({
        model: config.model,
        contents: message,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
        },
    }).catch((error: unknown) => {
        if (
            error instanceof Error &&
            error.name === 'APIConnectionTimeoutError'
        ) {
            throw new AssistantError(
                'TIMEOUT',
                'El asistente tardó demasiado en responder. Intenta nuevamente.',
            )
        }

        throw new AssistantError(
            'PROVIDER_ERROR',
            'El asistente no está disponible. Intenta más tarde.',
        )
    })
    const reply = response.text?.trim()

    if (!reply) {
        throw new AssistantError(
            'EMPTY_RESPONSE',
            'El asistente no devolvió una respuesta de texto.',
        )
    }

    return reply
}