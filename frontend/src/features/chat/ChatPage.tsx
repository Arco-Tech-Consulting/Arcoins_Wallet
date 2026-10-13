import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'


type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export default function ChatPage() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '¡Hola! Este es un chat de demostración. No tengo acceso a tus saldos ni movimientos.',
    },
  ])

  function handleSend() {
    const text = message.trim()

    if (!text || text.length > 2000) return

    setMessages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        role: 'user',
        text,
      },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Respuesta simulada: recibí tu mensaje. La conexión con Gemini todavía está pendiente.',
      },
    ])

    setMessage('')
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
          />

          <p id="chat-help" className="mt-2 text-xs text-ink-500">
            No compartas contraseñas, tokens ni información sensible.
          </p>

          <div className="mt-3 flex justify-end">
            <Button type="submit" disabled={!message.trim()}>
              Enviar
            </Button>
          </div>
        </form>
      </Card>
    </section>
  )
}
