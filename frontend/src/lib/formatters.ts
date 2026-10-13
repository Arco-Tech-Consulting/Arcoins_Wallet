import type { CurrencyCode } from '@/types/api'

export interface CurrencyMeta {
  code: CurrencyCode
  name: string
  symbol: string
  decimals: number
  locale: string
}

export const CURRENCY_META: Record<CurrencyCode, CurrencyMeta> = {
  COP: {
    code: 'COP',
    name: 'Peso colombiano',
    symbol: '$',
    decimals: 0,
    locale: 'es-CO',
  },
  USD: {
    code: 'USD',
    name: 'Dólar estadounidense',
    symbol: 'US$',
    decimals: 2,
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
    locale: 'de-DE',
  },
}

export function formatAmount(amount: number, currency: CurrencyCode): string {
  const meta = CURRENCY_META[currency]
  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(amount)
}

export function formatSymbolAmount(amount: number, currency: CurrencyCode): string {
  const meta = CURRENCY_META[currency]
  return `${meta.symbol}${new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(amount)}`
}

export function formatRate(rate: number, base: CurrencyCode, target: CurrencyCode): string {
  return `1 ${base} = ${rate} ${target}`
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function formatRateTimestamp(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}