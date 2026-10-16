import type { Request, Response } from 'express'
import { getAssistantReply } from '../services/assistant.service'
import { AssistantError } from '../services/assistant.errors'
import type { AssistantErrorCode } from '../services/assistant.errors'

const errorStatus: Record<AssistantErrorCode, number> = {
    INVALID_MESSAGE: 400,
    CONFIGURATION_ERROR: 503,
    PROVIDER_ERROR: 502,
    EMPTY_RESPONSE: 502,
    TIMEOUT: 504,
}

export async function chat(
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const reply = await getAssistantReply(req.body?.message)

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