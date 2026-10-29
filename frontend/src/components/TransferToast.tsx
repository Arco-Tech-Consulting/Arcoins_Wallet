import { useEffect } from 'react'
import { m, AnimatePresence } from 'motion/react'
import { useSocket } from '@/context/SocketContext'
import { formatSymbolAmount } from '@/lib/formatters'
import type { CurrencyCode } from '@/types/api'

/**
 * Toast que aparece en la esquina inferior derecha cuando el usuario
 * recibe una transferencia en tiempo real via Socket.io.
 * Se auto-descarta a los 6 segundos.
 */
export function TransferToast() {
  const { lastTransferNotification, clearTransferNotification } = useSocket()

  // Auto-descarte tras 6 segundos
  useEffect(() => {
    if (!lastTransferNotification) return
    const timer = setTimeout(clearTransferNotification, 6000)
    return () => clearTimeout(timer)
  }, [lastTransferNotification, clearTransferNotification])

  return (
    <AnimatePresence>
      {lastTransferNotification ? (
        <m.div
          key={lastTransferNotification.transferGroupId}
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-6 right-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-high px-4 py-3 shadow-lg"
        >
          {/* Ícono de dinero entrante */}
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-secondary">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>

          <div className="flex-1">
            <p className="text-sm font-semibold text-on-surface">
              ¡Recibiste una transferencia!
            </p>
            <p className="text-sm text-secondary">
              {formatSymbolAmount(
                lastTransferNotification.amount,
                lastTransferNotification.currency as CurrencyCode,
              )}
            </p>
            {lastTransferNotification.description ? (
              <p className="mt-0.5 text-xs text-on-surface-variant">
                {lastTransferNotification.description}
              </p>
            ) : null}
          </div>

          {/* Botón de cerrar */}
          <button
            type="button"
            onClick={clearTransferNotification}
            aria-label="Cerrar notificación"
            className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </m.div>
      ) : null}
    </AnimatePresence>
  )
}

