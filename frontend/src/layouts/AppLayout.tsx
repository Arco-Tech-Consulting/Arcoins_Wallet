import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'

interface NavItem {
  to: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/operations', label: 'Operaciones' },
  { to: '/deposit', label: 'Depósito' },
  { to: '/payments', label: 'Pagos' },
  { to: '/history', label: 'Historial' },
  { to: '/chat', label: 'Asistente' },
  { to: '/budget', label: 'Presupuesto' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-svh bg-surface">
      <header className="sticky top-0 z-10 border-b border-outline-variant/40 bg-surface-container-low/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-8">
            <span className="font-display text-lg font-bold tracking-tight text-on-surface">
              Arcoins Wallet
            </span>
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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

          <div className="flex items-center gap-3">
            {user ? (
              <span className="hidden text-sm text-on-surface-variant sm:block">
                {user.firstName} {user.lastName}
              </span>
            ) : null}
            <Button variant="ghost" onClick={logout} type="button">
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
