import type { Response } from 'express'
import type { AuthenticatedRequest } from '../types/auth.types'
import { getAssistantReply } from '../services/assistant.service'
import { AssistantError } from '../services/assistant.errors'
import type { AssistantErrorCode } from '../services/assistant.errors'
import { getAssistantFinancialSummary } from '../services/assistant.summary.service'
import { validateAssistantMessage } from '../services/assistant.validation'


const errorStatus: Record<AssistantErrorCode, number> = {
    INVALID_MESSAGE: 400,
    CONFIGURATION_ERROR: 503,
    PROVIDER_ERROR: 502,
    EMPTY_RESPONSE: 502,
    TIMEOUT: 504,
}

export async function chat(
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> {
    try {
        const userId = req.user?.id

        if (typeof userId !== 'string' || !userId.trim()) {
            res.status(401).json({
                error: 'Usuario no autenticado.',
            })
            return
        }

        const message = validateAssistantMessage(req.body?.message)
        const summary = await getAssistantFinancialSummary(userId)
        const reply = await getAssistantReply(message, summary)

        res.status(200).json({ reply })
    } catch (error: unknown) {
        if (error instanceof AssistantError) {
            res.status(errorStatus[error.code]).json({
                error: error.message,
            })
            return
        }

        res.status(500).json({
            error: 'No se pudo procesar el mensaje. Intenta más tarde.',
        })
    }
}