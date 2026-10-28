import { Button } from '@/components/ui/Button'
import { useEffect, useRef, useState } from 'react'
import { sendChatMessage } from '@/api/chat.api'
import { ApiError } from '@/api/client'


type ChatMessage = {
    id: string
    role: 'user' | 'assistant'
    text: string
}

export default function ChatPanel() {
    const [error, setError] = useState<string | null>(null)
    const [failedMessage, setFailedMessage] = useState<string | null>(null)
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const requestInFlight = useRef(false)
    const cooldownUntil = useRef(0)
    const [retrySeconds, setRetrySeconds] = useState(0)
    useEffect(() => {
        if (retrySeconds <= 0) return
        const timer = window.setInterval(() => {
            setRetrySeconds(Math.max(0, Math.ceil((cooldownUntil.current - Date.now()) / 1000)))
        }, 1000)
        return () => window.clearInterval(timer)
    }, [retrySeconds])
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            text: '¡Hola! Puedo ayudarte a interpretar el resumen de tus saldos y hasta 10 movimientos recientes cuando esté disponible. No puedo ejecutar operaciones ni consultar todo tu historial.',
        },
    ])


    async function handleSend(retryText?: string) {
        const text = retryText ?? message.trim()
        const isRetry = retryText !== undefined

        if (!text || text.length > 2000 || requestInFlight.current || Date.now() < cooldownUntil.current) return

        requestInFlight.current = true
        setIsLoading(true)
        setError(null)

        try {
            if (!isRetry) {
                setMessages((previous) => [
                    ...previous,
                    {
                        id: crypto.randomUUID(),
                        role: 'user',
                        text,
                    },
                ])

                setMessage('')
            }

            const response = await sendChatMessage({ message: text })

            if (typeof response.reply !== 'string' || !response.reply.trim()) {
                throw new Error('Respuesta inválida del asistente')
            }

            setMessages((previous) => [
                ...previous,
                {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    text: response.reply.trim(),
                },
            ])

            setFailedMessage(null)
        } catch (error: unknown) {
            if (error instanceof ApiError && error.status === 401) {
                setError('Tu sesión no es válida o ha vencido. Vuelve a iniciar sesión.')
                setFailedMessage(null)
            } else if (error instanceof ApiError && error.status === 429) {
                const payload = error.payload
                const seconds = typeof payload === 'object' && payload !== null &&
                    'retryAfterSeconds' in payload && typeof payload.retryAfterSeconds === 'number' &&
                    Number.isFinite(payload.retryAfterSeconds) && payload.retryAfterSeconds > 0
                    ? Math.min(3600, Math.ceil(payload.retryAfterSeconds)) : 60
                cooldownUntil.current = Date.now() + seconds * 1000
                setRetrySeconds(seconds)
                setError('Alcanzaste el límite de mensajes. Espera antes de reintentar.')
                setFailedMessage(text)
            } else if (error instanceof ApiError && error.status === 503) {
                setError('El asistente no está disponible en este momento. Intenta más tarde.')
                setFailedMessage(text)
            } else if (error instanceof ApiError && error.status === 504) {
                setError('El asistente tardó demasiado en responder. Puedes reintentar.')
                setFailedMessage(text)
            } else {
                setError('No se pudo obtener la respuesta. Puedes reintentar.')
                setFailedMessage(text)
            }
        } finally {
            requestInFlight.current = false
            setIsLoading(false)
        }
    }


    return (
        <div className="flex h-[min(540px,calc(100dvh-12rem))] min-h-0 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
                <p className="rounded-xl border border-primary/10 bg-primary/5 px-3 py-2.5 text-xs leading-relaxed text-on-surface-variant">
                    Al enviar un mensaje, compartes con Gemini tu mensaje, saldos y hasta
                    10 movimientos recientes para recibir orientación educativa.
                </p>
                <div role="log" aria-label="Conversación con el asistente" className="space-y-4">
                    {messages.map((item) => (
                        <div key={item.id} className={'flex ' + (item.role === 'user' ? 'justify-end' : 'justify-start')}>
                            <div className={'max-w-[92%] rounded-2xl px-4 py-3 ' + (
                                item.role === 'user'
                                    ? 'rounded-br-md bg-primary-container/30'
                                    : 'rounded-bl-md border border-outline-variant/20 bg-surface-container-high'
                            )}>
                                <p className={'mb-1.5 text-[11px] font-semibold tracking-wide ' + (item.role === 'user' ? 'text-primary' : 'text-on-surface-variant')}>
                                    {item.role === 'user' ? 'Tú' : 'Asistente'}
                                </p>
                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-on-surface">
                                    {item.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                {isLoading && (
                    <p role="status" className="flex items-center gap-2 px-1 text-xs text-on-surface-variant">
                        <span className="size-2 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden="true" />
                        Preparando tu respuesta…
                    </p>
                )}
                {error && (
                    <div className="rounded-xl border border-error/20 bg-error-container/30 p-3">
                        <p role="alert" className="text-sm text-on-error-container">{error}</p>
                        {failedMessage !== null && (
                            <Button type="button" variant="secondary" className="mt-2" disabled={isLoading || retrySeconds > 0} onClick={() => { void handleSend(failedMessage) }}>
                                Reintentar
                            </Button>
                        )}
                        {retrySeconds > 0 && <p role="status" className="mt-2 text-xs">Podrás reintentar en {retrySeconds} segundos.</p>}
                    </div>
                )}
            </div>
            <form
                className="shrink-0 border-t border-outline-variant/30 bg-surface-container-low px-4 py-3"
                onSubmit={(event) => {
                    event.preventDefault()
                    void handleSend()
                }}
            >
                <label htmlFor="chat-message" className="sr-only">Tu mensaje</label>
                <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                    <input
                        id="chat-message"
                        placeholder="¿En qué te puedo ayudar?"
                        maxLength={2000}
                        aria-describedby="chat-help"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        disabled={isLoading}
                        className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base text-on-surface outline-none placeholder:text-outline disabled:opacity-60 sm:text-sm"
                    />
                    <Button
                        type="submit"
                        aria-label={isLoading ? 'Respondiendo…' : 'Enviar'}
                        loading={isLoading}
                        disabled={!message.trim() || isLoading || retrySeconds > 0}
                        className="min-h-11 min-w-11 shrink-0 rounded-xl px-3"
                    >
                        {!isLoading && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
                                <path d="M12 19V5M5 12l7-7 7 7" />
                            </svg>
                        )}
                    </Button>
                </div>
                <p id="chat-help" className="mt-2 text-center text-[11px] leading-relaxed text-on-surface-variant">
                    No compartas contraseñas, tokens ni otros datos sensibles.
                </p>
            </form>
        </div>
    )
}
