import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ChatPanel from './ChatPanel'

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden="true">
      <path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
      <path d="M7 10h8M7 14h5" />
    </svg>
  )
}

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname === '/chat') setIsOpen(true)
  }, [pathname])

  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  function closeAssistant() {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 sm:right-6">
      <section
        ref={panelRef}
        id="floating-assistant"
        aria-label="Asistente de Arcoins"
        tabIndex={-1}
        hidden={!isOpen}
        className="mb-3 w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-primary/20 bg-surface-container-low text-on-surface shadow-[0_20px_70px_-15px_rgba(0,0,0,0.65)] outline-none sm:w-[400px]"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            closeAssistant()
          }
        }}
      >
        <header className="flex items-center gap-3 border-b border-outline-variant/30 bg-gradient-to-br from-primary/15 via-primary/5 to-surface-container-low px-4 py-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <ChatIcon />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold">Asistente Arcoins</h2>
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-primary">IA</span>
            </div>
            <p className="mt-0.5 text-xs text-on-surface-variant">Tu billetera, un poco más clara</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar asistente"
            onClick={closeAssistant}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-5" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <ChatPanel isOpen={isOpen} />
      </section>
      <div className="flex justify-end">
        <button
          ref={triggerRef}
          type="button"
          aria-label={isOpen ? 'Ocultar asistente' : 'Abrir asistente'}
          aria-expanded={isOpen}
          aria-controls="floating-assistant"
          onClick={() => isOpen ? closeAssistant() : setIsOpen(true)}
          className="flex min-h-14 items-center gap-3 rounded-full border border-primary/30 bg-primary py-3 pl-4 pr-5 font-semibold text-on-primary shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <ChatIcon />
          <span>{isOpen ? 'Ocultar' : 'Asistente'}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-4" aria-hidden="true">
            <path d={isOpen ? 'm6 9 6 6 6-6' : 'm6 15 6-6 6 6'} />
          </svg>
        </button>
      </div>
    </div>
  )
}
