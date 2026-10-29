import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { DEMO_TOKEN } from '@/mocks/handlers'
import { RatesPanel } from './RatesPanel'

beforeAll(() => {
  localStorage.setItem('arcoins.token', DEMO_TOKEN)
})

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <RatesPanel />
    </QueryClientProvider>,
  )
}

describe('RatesPanel', () => {
  it('muestra cada par con su tasa viva y la variación de 7 días', async () => {
    renderPanel()

    expect(await screen.findByText('Dólar → Peso')).toBeInTheDocument()
    expect(screen.getByText('Euro → Peso')).toBeInTheDocument()
    expect(screen.getByText('Euro → Dólar')).toBeInTheDocument()

    // Tasas vivas del mock (1 USD = 4180 COP)
    expect(screen.getByText('1 USD = 4180 COP')).toBeInTheDocument()
    expect(screen.getByText('1 EUR = 4550 COP')).toBeInTheDocument()
    expect(screen.getByText('1 EUR = 1.09 USD')).toBeInTheDocument()

    // Cada fila trae su badge de variación con signo es-CO
    expect(screen.getAllByText(/[+-][\d,]+%/)).toHaveLength(3)

    // Encabezado con marca de tiempo general
    expect(screen.getByText(/Del mercado · actualizadas/)).toBeInTheDocument()
  })

  it('expande el detalle de la semana al hacer click en la fila', async () => {
    const user = userEvent.setup()
    renderPanel()

    const row = await screen.findByRole('button', { name: /Dólar → Peso/ })
    expect(row).toHaveAttribute('aria-expanded', 'false')

    await user.click(row)

    expect(row).toHaveAttribute('aria-expanded', 'true')
    const detail = screen.getByRole('region', {
      name: 'Dólar → Peso, detalle de la semana',
    })
    expect(within(detail).getByText('Mínimo')).toBeInTheDocument()
    expect(within(detail).getByText('Máximo')).toBeInTheDocument()
    expect(within(detail).getByText('Variación')).toBeInTheDocument()
    expect(within(detail).getByText(/en 7 días/)).toBeInTheDocument()

    // La gráfica grande vive dentro del detalle
    expect(
      within(detail).getByRole('img', {
        name: 'Detalle de 7 días de Dólar → Peso',
      }),
    ).toBeInTheDocument()
  })

  it('degrada con nota cuando el historial no está disponible', async () => {
    server.use(
      http.get(
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@:date/v1/currencies/:base.json',
        () => new HttpResponse(null, { status: 500 }),
      ),
    )

    renderPanel()

    expect(await screen.findByText('Dólar → Peso')).toBeInTheDocument()
    const notes = await screen.findAllByText('Tendencia no disponible')
    expect(notes).toHaveLength(3)

    // La tasa viva sigue funcionando aunque el historial falle
    expect(await screen.findByText('1 USD = 4180 COP')).toBeInTheDocument()
  })
})
