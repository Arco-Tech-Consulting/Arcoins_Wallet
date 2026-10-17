import type { CurrencyCode } from '@/types/api'

export interface BudgetInput {
  days: number
  dailyAmount: number
}

export interface BudgetEstimate {
  days: number
  dailyAmount: number
  tripCurrency: CurrencyCode
  homeCurrency: CurrencyCode
  rate: number
  tripTotal: number
  homeTotal: number
}

function sanitize(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

/**
 * Estima el presupuesto de un viaje a partir de los días, el gasto diario
 * (en la moneda del destino) y la tasa hacia la moneda base del usuario.
 */
export function estimateBudget(
  input: BudgetInput,
  tripCurrency: CurrencyCode,
  homeCurrency: CurrencyCode,
  rate: number,
): BudgetEstimate {
  const days = Math.floor(sanitize(input.days))
  const dailyAmount = sanitize(input.dailyAmount)
  const tripTotal = days * dailyAmount

  const homeTotal =
    tripCurrency === homeCurrency
      ? tripTotal
      : tripTotal * sanitize(rate)

  return {
    days,
    dailyAmount,
    tripCurrency,
    homeCurrency,
    rate,
    tripTotal,
    homeTotal,
  }
}
