import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import {
  RateChart,
  computeHonestScale,
  formatDateTick,
  smoothPath,
} from './RateChart'

afterEach(cleanup)

describe('computeHonestScale', () => {
  it('usa el primer valor como línea base con eje simétrico', () => {
    const { baseline, span } = computeHonestScale([4200, 4230, 4185])
    expect(baseline).toBe(4200)
    expect(span).toBe(30)
  })

  it('garantiza un piso del 0.5% para series casi planas', () => {
    const { span } = computeHonestScale([4200, 4201, 4200])
    expect(span).toBe(4200 * 0.005)
  })

  it('series idénticas no colapsan el eje', () => {
    const { baseline, span } = computeHonestScale([5, 5, 5])
    expect(baseline).toBe(5)
    expect(span).toBe(0.025)
  })
})

describe('smoothPath', () => {
  it('dibuja curvas cúbicas entre los puntos', () => {
    const d = smoothPath([
      { x: 0, y: 10 },
      { x: 10, y: 5 },
      { x: 20, y: 8 },
    ])
    expect(d.startsWith('M0.00 10.00')).toBe(true)
    expect(d).toContain('C')
    expect(d).not.toContain('L')
  })

  it('con dos puntos traza una recta', () => {
    const d = smoothPath([
      { x: 0, y: 1 },
      { x: 2, y: 2 },
    ])
    expect(d).toBe('M0.00 1.00 L2.00 2.00')
  })
})

describe('formatDateTick', () => {
  it('formatea la fecha corta en es-CO', () => {
    expect(formatDateTick('2026-10-22')).toBe('22 de oct')
  })
})

describe('RateChart', () => {
  const series = [
    { date: '2026-10-22', rate: 4200 },
    { date: '2026-10-23', rate: 4210 },
    { date: '2026-10-26', rate: 4195 },
    { date: '2026-10-27', rate: 4225 },
    { date: '2026-10-28', rate: 4230 },
  ]

  it('mini: curva suave con un único marcador final', () => {
    render(<RateChart series={series} tone="up" label="Tendencia USD a COP" />)

    const chart = screen.getByRole('img', { name: 'Tendencia USD a COP' })
    const path = chart.querySelector('path')
    expect(path?.getAttribute('d')).toContain('C')
    expect(chart.querySelectorAll('circle')).toHaveLength(1)
  })

  it('detail: un punto por día y rango de fechas en el eje', () => {
    render(
      <RateChart series={series} tone="down" label="Detalle" variant="detail" />,
    )

    const chart = screen.getByRole('img', { name: 'Detalle' })
    expect(chart.querySelectorAll('circle')).toHaveLength(series.length)
    expect(chart.textContent).toContain('22 de oct')
    expect(chart.textContent).toContain('28 de oct')
  })

  /** Coordenadas Y de los puntos por los que pasa la curva (no los handles) */
  function onCurveYs(pathD: string): number[] {
    const ys: number[] = []
    for (const token of pathD.split('C')) {
      const nums = (token.match(/[\d.]+/g) ?? []).map(Number)
      if (nums.length >= 2) ys.push(nums[nums.length - 1])
    }
    return ys
  }

  it('escala honesta: la curva respeta los márgenes del lienzo', () => {
    const { container } = render(
      <RateChart series={series} tone="flat" label="Escala" variant="detail" />,
    )

    // La línea es el path sin comandos L (el área cierra con L)
    const line = [...container.querySelectorAll('path')].find(
      (path) => !path.getAttribute('d')?.includes('L'),
    )
    const ys = onCurveYs(line?.getAttribute('d') ?? '')
    expect(ys).toHaveLength(series.length)
    // Todos los puntos dentro del área con padding [18, 182] del viewBox 640×200
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(18)
    expect(Math.max(...ys)).toBeLessThanOrEqual(182)
  })

  it('escala honesta: una variación real mínima no llena el alto', () => {
    const calmSeries = [
      { date: '2026-10-22', rate: 4200 },
      { date: '2026-10-23', rate: 4200.6 },
      { date: '2026-10-26', rate: 4200.2 },
      { date: '2026-10-27', rate: 4200.4 },
    ]
    const { container } = render(
      <RateChart series={calmSeries} tone="flat" label="Calma" variant="detail" />,
    )

    const line = [...container.querySelectorAll('path')].find(
      (path) => !path.getAttribute('d')?.includes('L'),
    )
    const ys = onCurveYs(line?.getAttribute('d') ?? '')
    const spread = Math.max(...ys) - Math.min(...ys)

    // Variación real de ~0.014%: la curva ocupa solo una franja central,
    // no zigzaguea por todo el alto (área útil: 164px del viewBox)
    expect(spread).toBeLessThan(20)
  })

  it('serie corta muestra el estado vacío', () => {
    render(<RateChart series={[{ date: '2026-10-22', rate: 4200 }]} tone="flat" label="X" />)
    expect(screen.getByText('Sin serie disponible')).toBeInTheDocument()
  })
})
