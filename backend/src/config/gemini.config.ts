export interface GeminiConfig {
    apiKey: string
    fallbackModels: string[]
    model: string
    timeoutMs: number
}

export function getGeminiConfig(
    env: NodeJS.ProcessEnv = process.env,
): GeminiConfig {
    const apiKey = env.GEMINI_API_KEY?.trim()
    const model = env.GEMINI_MODEL?.trim()
    const timeoutMs = Number(env.GEMINI_TIMEOUT_MS ?? '15000')

    if (!apiKey) {
        throw new Error('Falta configurar GEMINI_API_KEY.')
    }

    if (!model) {
        throw new Error('Falta configurar GEMINI_MODEL.')
    }

    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
        throw new Error('GEMINI_TIMEOUT_MS debe ser un entero positivo.')
    }

    const fallbackModels = [...new Set((env.GEMINI_FALLBACK_MODELS ?? '')
        .split(',').map((name) => name.trim()).filter((name) => name && name !== model))]
    if (fallbackModels.length > 2) {
        throw new Error('Configura como máximo dos modelos de respaldo.')
    }
    return { apiKey, model, fallbackModels, timeoutMs }
}