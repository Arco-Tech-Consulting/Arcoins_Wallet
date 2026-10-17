import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'
import { DEMO_TOKEN } from '@/mocks/handlers'
import { renderWithProviders } from '@/test/utils'
import DepositPage from './DepositPage'

describe('DepositPage', () => {
  beforeAll(() => {
    localStorage.setItem('arcoins.token', DEMO_TOKEN)
  })

  it('muestra los saldos y el formulario de depósito', async () => {
    renderWithProviders(<DepositPage />)

    expect(
      screen.getByRole('heading', { name: 'Depósito' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Peso colombiano')).toBeInTheDocument()
    expect(screen.getByLabelText('Moneda')).toBeInTheDocument()
    expect(screen.getByLabelText('Monto en COP')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Depositar' }),
    ).toBeInTheDocument()
  })

  it('deshabilita el botón mientras el monto no es válido', () => {
    renderWithProviders(<DepositPage />)

    expect(screen.getByRole('button', { name: 'Depositar' })).toBeDisabled()
  })

  it('registra un depósito y muestra la confirmación', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DepositPage />)

    const amount = await screen.findByLabelText('Monto en COP')
    await user.type(amount, '100000')
    await user.click(screen.getByRole('button', { name: 'Depositar' }))

    expect(await screen.findByText(/Depósito realizado/)).toBeInTheDocument()
  })
})
