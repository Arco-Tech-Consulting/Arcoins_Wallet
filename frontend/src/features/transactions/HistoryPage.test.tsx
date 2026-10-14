import { screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { DEMO_TOKEN } from '@/mocks/handlers'
import { renderWithProviders } from '@/test/utils'
import HistoryPage from './HistoryPage'

describe('HistoryPage', () => {
  beforeAll(() => {
    localStorage.setItem('arcoins.token', DEMO_TOKEN)
  })

  it('lista los movimientos del mock', async () => {
    renderWithProviders(<HistoryPage />)

    expect(await screen.findByText('Compra de dólares')).toBeInTheDocument()
    expect(screen.getByText('Depósito en saldo')).toBeInTheDocument()
    expect(screen.getByText('Conversión USD a EUR')).toBeInTheDocument()
  })
})
