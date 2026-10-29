import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { useSocket } from '@/context/SocketContext'
import { formatDateTime, formatSymbolAmount } from '@/lib/formatters'
import type { CurrencyCode } from '@/types/api'

function BellIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

/**
 * Campana del header con el centro de notificaciones de la sesión.
 * Muestra las transferencias recibidas en tiempo real via Socket.io
 * y un badge con la cantidad de notificaciones sin leer.
 */
export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markNotificationsAsRead,
    clearNotifications,
  } = useSocket()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cierra el panel al hacer click fuera o al presionar Escape
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function togglePanel() {
    // Al abrir el panel, todo lo acumulado pasa a "leído"
    if (!isOpen && unreadCount > 0) markNotificationsAsRead()
    setIsOpen((open) => !open)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : 'Notificaciones'
        }
        aria-expanded={isOpen}
        aria-controls="notification-panel"
        aria-haspopup="dialog"
        onClick={togglePanel}
        className="relative flex size-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <BellIcon className="size-6" />

        {unreadCount > 0 ? (
          <span
            className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error"
            data-testid="notification-badge"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <m.div
            id="notification-panel"
            role="dialog"
            aria-label="Centro de notificaciones"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 flex w-80 max-w-[calc(100vw-2rem)] origin-top-right flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low text-on-surface shadow-[0_16px_50px_-12px_rgba(0,0,0,0.55)]"
          >
            <header className="flex items-center justify-between gap-2 border-b border-outline-variant/30 px-4 py-3">
              <h2 className="text-sm font-semibold">Notificaciones</h2>
              {notifications.length > 0 ? (
                <button
                  type="button"
                  onClick={clearNotifications}
                  className="rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Limpiar
                </button>
              ) : null}
            </header>

            <ul className="max-h-96 flex-1 divide-y divide-outline-variant/20 overflow-y-auto">
              {notifications.length === 0 ? (
                <li className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
                    <BellIcon className="size-5" />
                  </span>
                  <p className="text-sm text-on-surface-variant">
                    Aún no tienes notificaciones.
                    <br />
                    Aquí verás las transferencias que recibas.
                  </p>
                </li>
              ) : (
                notifications.map((notification) => (
                  <li
                    key={notification.transferGroupId}
                    className="flex items-start gap-3 px-4 py-3"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-secondary">
                      <svg
                        viewBox="0 0 24 24"
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        ¡Recibiste una transferencia!
                      </p>
                      <p className="text-sm text-secondary">
                        {formatSymbolAmount(
                          notification.amount,
                          notification.currency as CurrencyCode,
                        )}
                      </p>
                      {notification.description ? (
                        <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                          {notification.description}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-on-surface-variant/70">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
