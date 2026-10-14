import { describe, expect, it } from 'vitest'
import { estimateBudget } from './budget.utils'

describe('estimateBudget', () => {
  it('multiplica días por gasto diario y convierte a la moneda base', () => {
    const result = estimateBudget(
      { days: 5, dailyAmount: 100 },
      'USD',
      'COP',
      4180,
    )

    expect(result.tripTotal).toBe(500)
    expect(result.homeTotal).toBe(2090000)
  })

  it('no convierte cuando la moneda del viaje es la base', () => {
    const result = estimateBudget(
      { days: 3, dailyAmount: 50000 },
      'COP',
      'COP',
      4180,
    )

    expect(result.homeTotal).toBe(150000)
  })

  it('ignora valores inválidos o negativos', () => {
    const result = estimateBudget(
      { days: -2, dailyAmount: 100 },
      'USD',
      'COP',
      4180,
    )

    expect(result.days).toBe(0)
    expect(result.tripTotal).toBe(0)
    expect(result.homeTotal).toBe(0)
  })

  it('redondea los días hacia abajo', () => {
    const result = estimateBudget(
      { days: 2.9, dailyAmount: 100 },
      'USD',
      'COP',
      4180,
    )

    expect(result.days).toBe(2)
    expect(result.tripTotal).toBe(200)
  })
})
