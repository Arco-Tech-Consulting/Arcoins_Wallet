import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ReactElement } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { DEMO_TOKEN } from '@/mocks/handlers'
import App from '@/App'
import AppLayout from '@/layouts/AppLayout'

const NAV_LABELS = [
  'Dashboard',
  'Operaciones',
  'Depósito',
  'Pagos',
  'Historial',
  'Asistente',
  'Presupuesto',
]

describe('LandingPage', () => {
  beforeEach(() => {
    localStorage.removeItem('arcoins.token')
  })

  it('muestra el hero con las acciones de cuenta', () => {
    renderWithProviders(<App />, '/')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tu dinero, en tres monedas y en un solo lugar.',
      }),
    ).toBeInTheDocument()

    const registerLinks = screen.getAllByRole('link', {
      name: 'Crear mi billetera',
    })
    registerLinks.forEach((link) =>
      expect(link).toHaveAttribute('href', '/register'),
    )

    const loginLinks = screen.getAllByRole('link', { name: 'Ya tengo cuenta' })
    loginLinks.forEach((link) => expect(link).toHaveAttribute('href', '/login'))
  })

  it('muestra las secciones con las cifras ilustrativas', () => {
    renderWithProviders(<App />, '/')

    expect(
      screen.getByRole('heading', {
        name: 'De cero a tu primera conversión en minutos',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Cifras ilustrativas. Inicia sesión para ver tus saldos reales y las tasas del momento.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Todo lo que hace tu billetera' }),
    ).toBeInTheDocument()
  })

  it('redirige al dashboard cuando ya hay sesión', async () => {
    localStorage.setItem('arcoins.token', DEMO_TOKEN)
    renderWithProviders(<App />, '/')

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Dashboard' },
        { timeout: 4000 },
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Tu dinero, en tres monedas y en un solo lugar.'),
    ).not.toBeInTheDocument()
  })
})

describe('AppLayout', () => {
  beforeEach(() => {
    localStorage.removeItem('arcoins.token')
  })

  it('muestra la navegación principal con el dashboard como inicio', () => {
    renderAppLayout()

    NAV_LABELS.forEach((label) => {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
  })

  it('abre el menú móvil, muestra el diálogo y cierra al navegar', async () => {
    const user = userEvent.setup()
    renderAppLayout()

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))

    const dialog = await screen.findByRole('dialog', {
      name: 'Menú de navegación',
    })
    expect(
      within(dialog).getByRole('link', { name: 'Depósito' }),
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('link', { name: 'Depósito' }))

    await waitFor(
      () => {
        expect(
          screen.queryByRole('dialog', { name: 'Menú de navegación' }),
        ).not.toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('cierra el menú móvil con Escape', async () => {
    const user = userEvent.setup()
    renderAppLayout()

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    await screen.findByRole('dialog', { name: 'Menú de navegación' })

    await user.keyboard('{Escape}')

    await waitFor(
      () => {
        expect(
          screen.queryByRole('dialog', { name: 'Menú de navegación' }),
        ).not.toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })
})

function renderWithProviders(ui: ReactElement, route: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function renderAppLayout() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<div>contenido</div>} />
              <Route path="/deposit" element={<div>contenido</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
