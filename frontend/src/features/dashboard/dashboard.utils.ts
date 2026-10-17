import { getRate } from '@/api/rates.api'
import { CURRENCIES, type CurrencyCode, type WalletBalance } from '@/types/api'

/**
 * Suma los saldos de la billetera expresados en una moneda de referencia.
 * `rates` debe mapear cada moneda -> tasa hacia la moneda base.
 */
export function computeTotal(
  balances: WalletBalance[],
  rates: Partial<Record<CurrencyCode, number>>,
  base: CurrencyCode,
): number {
  return balances.reduce((total, balance) => {
    if (balance.currency === base) {
      return total + balance.amount
    }
    const rate = rates[balance.currency]
    return rate ? total + balance.amount * rate : total
  }, 0)
}

/**
 * Obtiene la tasa de cada moneda (excepto la base) hacia la moneda base.
 */
export async function fetchRatesToBase(
  base: CurrencyCode,
): Promise<Partial<Record<CurrencyCode, number>>> {
  const others = CURRENCIES.filter((currency) => currency !== base)
  const rates = await Promise.all(
    others.map((currency) => getRate(currency, base)),
  )
  return Object.fromEntries(
    rates.map((rate) => [rate.base, rate.rate]),
  ) as Partial<Record<CurrencyCode, number>>
}