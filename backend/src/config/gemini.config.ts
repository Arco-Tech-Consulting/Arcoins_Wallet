export interface GeminiConfig {
    apiKey: string
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

    return { apiKey, model, timeoutMs }
}