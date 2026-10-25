import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'

interface DrawerProps {
  id?: string
  label: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Drawer({ id, label, open, onClose, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <>
          <m.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <m.aside
            id={id}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-l border-outline-variant/40 bg-surface-container-low p-6 shadow-2xl shadow-black/40"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
          >
            {children}
          </m.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
