import { describe, expect, it } from 'vitest'
import { formatAmount, formatRate } from './formatters'

describe('formatAmount', () => {
  it('formatea COP sin decimales', () => {
    expect(formatAmount(2_500_000, 'COP')).toContain('2.500.000')
  })

  it('formatea USD con dos decimales', () => {
    expect(formatAmount(1_200, 'USD')).toContain('1,200.00')
  })
})

describe('formatRate', () => {
  it('muestra base, tasa y destino', () => {
    expect(formatRate(4_180, 'USD', 'COP')).toBe('1 USD = 4180 COP')
  })
})