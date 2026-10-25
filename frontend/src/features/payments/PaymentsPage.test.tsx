import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'
import { DEMO_TOKEN } from '@/mocks/handlers'
import { renderWithProviders } from '@/test/utils'
import PaymentsPage from './PaymentsPage'

describe('PaymentsPage', () => {
  beforeAll(() => {
    localStorage.setItem('arcoins.token', DEMO_TOKEN)
  })

  it('muestra los comercios, los saldos y el formulario de pago', async () => {
    renderWithProviders(<PaymentsPage />)

    expect(screen.getByRole('heading', { name: 'Pagos' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Comercio')).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'Café Andino' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Monto en COP')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeInTheDocument()

    expect(await screen.findByText('Peso colombiano')).toBeInTheDocument()
    expect(await screen.findByText('Saldo en COP')).toBeInTheDocument()
  })

  it('deshabilita el botón mientras el monto no es válido', () => {
    renderWithProviders(<PaymentsPage />)

    expect(screen.getByRole('button', { name: 'Pagar' })).toBeDisabled()
  })

  it('registra un pago y muestra la confirmación', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PaymentsPage />)

    const amount = await screen.findByLabelText('Monto en COP')
    await user.type(amount, '35000')

    const submit = screen.getByRole('button', { name: 'Pagar' })
    await waitFor(() => expect(submit).toBeEnabled())
    await user.click(submit)

    expect(
      await screen.findByText(/Pago realizado a/),
    ).toBeInTheDocument()
  })
})
