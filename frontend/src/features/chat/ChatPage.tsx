import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useRef, useState } from 'react'


type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export default function ChatPage() {
  const [error, setError] = useState<string | null>(null)
  const [failedMessage, setFailedMessage] = useState<string | null>(null)
  const [simulateError, setSimulateError] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const requestInFlight = useRef(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '¡Hola! Este es un chat de demostración. No tengo acceso a tus saldos ni movimientos.',
    },
  ])


  async function handleSend(retryText?: string) {
    const text = retryText ?? message.trim()
    const isRetry = retryText !== undefined

    if (!text || text.length > 2000 || requestInFlight.current) return

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

      // Demora simulada: no llama al backend ni a Gemini.
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1000)
      })

      if (simulateError) {
        setSimulateError(false)
        throw new Error('Fallo simulado')
      }

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Respuesta simulada: recibí tu mensaje. La conexión con Gemini todavía está pendiente.',
        },
      ])

      setFailedMessage(null)
    } catch {
      setError('No se pudo obtener la respuesta. Puedes reintentar.')
      setFailedMessage(text)
    } finally {
      requestInFlight.current = false
      setIsLoading(false)
    }
  }


  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">
          Asistente de Arcoins
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Consulta sobre la billetera y la organización de tus gastos.
        </p>
      </header>

      <Card>
        <p className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
          Modo demostración: todavía no hay conexión con Gemini.
        </p>

        <div
          role="log"
          aria-label="Conversación con el asistente"
          className="max-h-96 min-h-64 space-y-3 overflow-y-auto"
        >
          {messages.map((item) => (
            <div
              key={item.id}
              className={`max-w-lg rounded-xl p-4 ${item.role === 'user'
                ? 'ml-auto bg-brand-50'
                : 'bg-ink-100'
                }`}
            >
              <p className="mb-1 text-sm font-semibold text-ink-900">
                {item.role === 'user' ? 'Tú' : 'Asistente'}
              </p>
              <p className="whitespace-pre-wrap break-words text-sm text-ink-700">
                {item.text}
              </p>
            </div>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={simulateError}
            disabled={isLoading}
            onChange={(event) => setSimulateError(event.target.checked)}
          />
          Demostración: hacer fallar el siguiente intento
        </label>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3">
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>

            {failedMessage !== null && (
              <Button
                type="button"
                variant="secondary"
                className="mt-2"
                disabled={isLoading}
                onClick={() => {
                  void handleSend(failedMessage)
                }}
              >
                Reintentar
              </Button>
            )}
          </div>
        )}
        <form
          className="mt-4 border-t border-ink-200 pt-4"
          onSubmit={(event) => {
            event.preventDefault()
            handleSend()
          }}
        >
          <Input
            id="chat-message"
            label="Tu mensaje"
            placeholder="Escribe tu pregunta"
            maxLength={2000}
            aria-describedby="chat-help"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={isLoading}
          />

          <p id="chat-help" className="mt-2 text-xs text-ink-500">
            No compartas contraseñas, tokens ni información sensible.
          </p>

          <div className="mt-3 flex justify-end">
            <Button
              type="submit"
              loading={isLoading}
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? 'Respondiendo…' : 'Enviar'}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  )
}
