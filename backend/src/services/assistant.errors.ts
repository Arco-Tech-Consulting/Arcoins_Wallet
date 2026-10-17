export type AssistantErrorCode =
    | 'INVALID_MESSAGE'
    | 'CONFIGURATION_ERROR'
    | 'PROVIDER_ERROR'
    | 'EMPTY_RESPONSE'
    | 'TIMEOUT'

export class AssistantError extends Error {
    constructor(
        public readonly code: AssistantErrorCode,
        message: string,
    ) {
        super(message)
        this.name = 'AssistantError'
    }
}