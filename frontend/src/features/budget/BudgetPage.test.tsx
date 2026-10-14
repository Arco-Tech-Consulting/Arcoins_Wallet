import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import BudgetPage from './BudgetPage'

describe('BudgetPage', () => {
  it('estima el total del viaje según días y gasto diario', () => {
    renderWithProviders(<BudgetPage />)

    expect(
      screen.getByRole('heading', { name: 'Calculadora de presupuesto' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Total del viaje')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Días'), {
      target: { value: '5' },
    })
    fireEvent.change(screen.getByLabelText('Gasto diario'), {
      target: { value: '100' },
    })

    expect(screen.getByText('$500.00')).toBeInTheDocument()
  })
})
