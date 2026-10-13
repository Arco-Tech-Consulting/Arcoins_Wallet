import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { DEMO_TOKEN } from '@/mocks/handlers'
import DashboardPage from './DashboardPage'

describe('DashboardPage', () => {
  beforeAll(() => {
    localStorage.setItem('arcoins.token', DEMO_TOKEN)
  })

  it('muestra los saldos de las tres monedas', async () => {
    const client = new QueryClient()

    render(
      <QueryClientProvider client={client}>
        <DashboardPage />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText('Peso colombiano'),
    ).toBeInTheDocument()
    expect(screen.getByText('Dólar estadounidense')).toBeInTheDocument()
    expect(screen.getByText('Euro')).toBeInTheDocument()
  })
})