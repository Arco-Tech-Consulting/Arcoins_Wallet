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
  { to: '/history', label: 'Historial' },
  { to: '/chat', label: 'Asistente' },
  { to: '/budget', label: 'Presupuesto' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-svh bg-ink-50">
      <header className="sticky top-0 z-10 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold tracking-tight text-ink-900">
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
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800'
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
              <span className="hidden text-sm text-ink-600 sm:block">
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