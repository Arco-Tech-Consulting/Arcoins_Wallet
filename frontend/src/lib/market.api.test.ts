import { describe, expect, it } from 'vitest'
import {
  computeDeltaPercent,
  fetchRateHistory,
  formatDeltaPercent,
  getRecentDates,
  ticksFromHistory,
} from './market.api'
import type { RateHistoryPoint } from './market.api'

describe('getRecentDates', () => {
  it('devuelve N fechas consecutivas de la más vieja a la más nueva', () => {
    const now = new Date('2026-10-28T12:00:00Z')
    const dates = getRecentDates(7, now)
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2026-10-22')
    expect(dates[dates.length - 1]).toBe('2026-10-28')
  })
})

describe('fetchRateHistory', () => {
  it('omite los fines de semana sin snapshot (404)', async () => {
    // Semana del 22 al 28 de octubre de 2026: 24 (sábado) y 25 (domingo)
    // no se publican en la API, así que la serie queda con 5 puntos.
    const dates = getRecentDates(7, new Date('2026-10-28T12:00:00Z'))
    const history = await fetchRateHistory('USD', dates)
    expect(history.map((point) => point.date)).toEqual([
      '2026-10-22',
      '2026-10-23',
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
    ])
    const last = history[history.length - 1]
    expect(last.rates.COP).toBeGreaterThan(0)
    expect(last.rates.EUR).toBeGreaterThan(0)
  })

  it('falla si no hay datos suficientes en el rango', async () => {
    // Solo fechas de fin de semana: no se publica ningún snapshot
    const dates = ['2026-10-24', '2026-10-25']
    await expect(fetchRateHistory('USD', dates)).rejects.toThrow(
      /datos suficientes/,
    )
  })
})

describe('ticksFromHistory', () => {
  const history: RateHistoryPoint[] = [
    { date: '2026-10-22', rates: { COP: 4200, EUR: 0.9 } },
    { date: '2026-10-23', rates: { COP: 4210, EUR: 0.89 } },
    { date: '2026-10-26', rates: {} },
    { date: '2026-10-27', rates: { EUR: 0.88 } },
  ]

  it('extrae la serie del target descartando días incompletos', () => {
    const cop = ticksFromHistory(history, 'COP')
    expect(cop).toEqual([
      { date: '2026-10-22', rate: 4200 },
      { date: '2026-10-23', rate: 4210 },
    ])
  })
})

describe('computeDeltaPercent', () => {
  it('calcula la variación entre el primer y el último punto', () => {
    const ticks = [
      { date: '2026-10-22', rate: 4200 },
      { date: '2026-10-28', rate: 4230 },
    ]
    expect(computeDeltaPercent(ticks)).toBeCloseTo((30 / 4200) * 100, 6)
  })

  it('es negativa cuando la tasa baja', () => {
    const ticks = [
      { date: '2026-10-22', rate: 4200 },
      { date: '2026-10-28', rate: 4158 },
    ]
    expect(computeDeltaPercent(ticks)).toBeLessThan(0)
  })
})

describe('formatDeltaPercent', () => {
  it('usa coma decimal y signo positivo explícito', () => {
    expect(formatDeltaPercent(0.7126)).toBe('+0,71%')
    expect(formatDeltaPercent(-0.3)).toBe('-0,30%')
    expect(formatDeltaPercent(0)).toBe('0,00%')
  })
})