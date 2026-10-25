import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { useAuth } from '@/context/AuthContext'
import { Brand } from '@/components/ui/Brand'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'

interface NavItem {
  to: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/operations', label: 'Operaciones' },
  { to: '/deposit', label: 'Depósito' },
  { to: '/payments', label: 'Pagos' },
  { to: '/history', label: 'Historial' },
  { to: '/chat', label: 'Asistente' },
  { to: '/budget', label: 'Presupuesto' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-svh bg-surface">
      <header className="sticky top-0 z-30 border-b border-outline-variant/40 bg-surface-container-low/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" aria-label="Arcoins Wallet, dashboard">
              <Brand markClassName="size-7" />
            </Link>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-container/20 text-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <span className="hidden text-sm text-on-surface-variant md:block">
                {user.firstName} {user.lastName}
              </span>
            ) : null}
            <Button
              variant="ghost"
              onClick={logout}
              type="button"
              className="hidden md:inline-flex"
            >
              Salir
            </Button>

            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface md:hidden"
              aria-expanded={menuOpen}
              aria-controls="app-drawer"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuOpen(true)}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <Drawer
        id="app-drawer"
        label="Menú de navegación"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        <nav className="flex flex-1 flex-col gap-1" aria-label="Principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `min-h-11 rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-container/20 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user ? (
          <p className="mb-3 px-3 text-sm text-on-surface-variant">
            {user.firstName} {user.lastName}
          </p>
        ) : null}
        <Button
          variant="ghost"
          type="button"
          className="w-full"
          onClick={() => {
            setMenuOpen(false)
            logout()
          }}
        >
          Salir
        </Button>
      </Drawer>

      <AnimatePresence mode="wait">
        <m.main
          key={location.pathname}
          className="mx-auto w-full max-w-6xl px-4 py-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <Outlet />
        </m.main>
      </AnimatePresence>
    </div>
  )
}
