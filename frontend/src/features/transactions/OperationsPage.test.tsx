import { screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { DEMO_TOKEN } from '@/mocks/handlers'
import { renderWithProviders } from '@/test/utils'
import OperationsPage from './OperationsPage'

describe('OperationsPage', () => {
  beforeAll(() => {
    localStorage.setItem('arcoins.token', DEMO_TOKEN)
  })

  it('muestra las tres operaciones y el formulario con la tasa', async () => {
    renderWithProviders(<OperationsPage />)

    expect(screen.getByRole('button', { name: 'Comprar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vender' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Intercambiar' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Confirmar operación' }),
    ).toBeInTheDocument()

    expect(await screen.findByText('Tasa')).toBeInTheDocument()
  })
})
