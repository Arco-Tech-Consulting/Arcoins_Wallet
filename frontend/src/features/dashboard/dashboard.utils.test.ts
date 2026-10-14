import { describe, expect, it } from 'vitest'
import { computeTotal } from './dashboard.utils'
import type { WalletBalance } from '@/types/api'

const balances: WalletBalance[] = [
  { currency: 'COP', amount: 2_500_000 },
  { currency: 'USD', amount: 1_200 },
  { currency: 'EUR', amount: 850 },
]

describe('computeTotal', () => {
  it('convierte todos los saldos a COP usando las tasas hacia COP', () => {
    const rates = { USD: 4_180, EUR: 4_550 }
    const expected = 2_500_000 + 1_200 * 4_180 + 850 * 4_550
    expect(computeTotal(balances, rates, 'COP')).toBe(expected)
  })

  it('convierte a USD cuando la base es USD', () => {
    const rates = { COP: 1 / 4_180, EUR: 1 / 1.09 }
    const expected = 1_200 + 2_500_000 / 4_180 + 850 / 1.09
    expect(computeTotal(balances, rates, 'USD')).toBeCloseTo(expected, 6)
  })

  it('no suma una moneda sin tasa disponible', () => {
    const rates = { USD: 4_180 }
    const expected = 2_500_000 + 1_200 * 4_180
    expect(computeTotal(balances, rates, 'COP')).toBe(expected)
  })

  it('retorna 0 cuando no hay saldos', () => {
    expect(computeTotal([], {}, 'COP')).toBe(0)
  })
})