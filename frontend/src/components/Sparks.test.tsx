import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Sparks } from './Sparks'

afterEach(cleanup)

describe('Sparks', () => {
  it('dibuja la serie completa con su etiqueta accesible y tendencia al alza', () => {
    render(
      <Sparks
        data={[4200, 4210, 4215, 4230, 4235, 4240]}
        tone="up"
        label="Tendencia de 7 días de Dólar → Peso"
      />,
    )

    const chart = screen.getByRole('img', {
      name: 'Tendencia de 7 días de Dólar → Peso',
    })
    expect(chart).toBeInTheDocument()
    expect(chart).toHaveTextContent('al alza')

    // 6 segmentos conectan los 6 puntos de la serie (M + 5 L)
    const path = chart.querySelector('path')
    expect(path).not.toBeNull()
    expect(path?.getAttribute('d')?.split(/[ML]/).filter(Boolean)).toHaveLength(6)
  })

  it('muestra un vacío cuando la serie no alcanza los 2 puntos', () => {
    render(<Sparks data={[4200]} tone="flat" label="Serie corta" />)
    expect(screen.getByText('Sin serie disponible')).toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: 'Serie corta' }),
    ).not.toBeInTheDocument()
  })
})
