import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RateHistoryPanel } from './RateHistoryPanel'

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <RateHistoryPanel />
    </QueryClientProvider>,
  )
}

describe('RateHistoryPanel', () => {
  it('muestra la tendencia de los tres pares con variación porcentual', async () => {
    renderPanel()

    expect(await screen.findByText('Dólar → Peso')).toBeInTheDocument()
    expect(screen.getByText('Euro → Peso')).toBeInTheDocument()
    expect(screen.getByText('Euro → Dólar')).toBeInTheDocument()

    // Los tres pares traen su sparkline con etiqueta accesible
    expect(
      screen.getByRole('img', { name: 'Tendencia de 7 días de Dólar → Peso' }),
    ).toBeInTheDocument()

    // La variación de la semana aparece con signo es-CO
    expect(screen.getAllByText(/[+-][\d,]+%/)).toHaveLength(3)

    expect(
      screen.getByText(/Últimos 7 días · datos diarios del mercado/),
    ).toBeInTheDocument()
  })
})
