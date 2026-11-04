import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { DEMO_TOKEN } from '@/mocks/handlers'
import TransferPage from './TransferPage'

beforeAll(() => {
  localStorage.setItem('arcoins.token', DEMO_TOKEN)
})

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <TransferPage />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

const RECIPIENT_EMAIL = 'maria@arcoins.app'

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, amount: string) {
  await user.type(
    screen.getByLabelText('Correo del receptor'),
    RECIPIENT_EMAIL,
  )
  await user.type(screen.getByLabelText('Monto en COP'), amount)
  await user.click(screen.getByRole('button', { name: 'Confirmar transferencia' }))
}

describe('TransferPage', () => {
  it('muestra el ancla con el correo propio y envía una transferencia con éxito', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(
      await screen.findByText(/comparte tu correo:/),
    ).toHaveTextContent('sebastian@arcoins.app')

    await fillAndSubmit(user, '100')

    expect(
      await screen.findByText(/Transferencia realizada correctamente/),
    ).toBeInTheDocument()
    // La descripción del mock usa el correo del receptor
    expect(screen.getByText(/Enviaste/)).toBeInTheDocument()

    // Los campos se limpian tras el éxito
    await waitFor(() => {
      expect(screen.getByLabelText('Correo del receptor')).toHaveValue('')
    })
  })

  it('marca error de formato en correos inválidos y bloquea el envío', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Correo del receptor'), 'correo-invalido')

    expect(
      screen.getByText('El formato del correo electrónico no es válido'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Confirmar transferencia' }),
    ).toBeDisabled()
  })

  it('avisa los fondos insuficientes y no envía', async () => {
    const user = userEvent.setup()
    renderPage()

    await fillAndSubmit(user, '3000000')

    expect(
      await screen.findByText(/No tienes fondos suficientes en COP/),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Transferencia realizada correctamente/),
    ).not.toBeInTheDocument()
  })
})
