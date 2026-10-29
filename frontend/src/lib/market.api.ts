import type { CurrencyCode } from '@/types/api'

/**
 * Fuente de datos externa para el comportamiento histórico de las tasas:
 * currency-api (@fawazahmed0/currency-api) servida por jsDelivr.
 * Publica un snapshot diario sin key y con CORS abierto; no publica fines
 * de semana (los días sin datos se descartan).
 */
const CURRENCY_API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api'
const REQUEST_TIMEOUT = 8000

/**
 * Snapshot diario de la tasa: fecha ISO + tasas disponibles de esa fecha
 * (por ejemplo de USD a las demás monedas).
 */
export interface RateHistoryPoint {
  date: string
  rates: Partial<Record<CurrencyCode, number>>
}

/** Serie de la tasa de un día: fecha ISO (YYYY-MM-DD) + valor de la tasa */
export interface RateTick {
  date: string
  rate: number
}

/**
 * Fechas ISO (YYYY-MM-DD) de los últimos `days` días calendario,
 * de la más vieja a la más nueva (incluye hoy).
 */
export function getRecentDates(days: number, now: Date = new Date()): string[] {
  const dates: string[] = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now)
    date.setUTCDate(date.getUTCDate() - offset)
    dates.push(date.toISOString().slice(0, 10))
  }
  return dates
}

interface CurrencyApiSnapshot {
  date: string
  [base: string]: string | Record<string, number>
}

async function fetchSnapshotForDate(
  base: string,
  date: string,
): Promise<Record<string, number> | null> {
  try {
    const response = await fetch(
      `${CURRENCY_API_URL}@${date}/v1/currencies/${base.toLowerCase()}.json`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT) },
    )
    // Los fines de semana (y fechas perdidas) quedan sin snapshot: se saltan
    if (!response.ok) return null
    const data = (await response.json()) as CurrencyApiSnapshot
    const rates = data[base.toLowerCase()]
    if (typeof rates !== 'object' || rates === null) return null
    return rates
  } catch {
    return null
  }
}

/**
 * Snapshots diarios de `base` para las fechas dadas (de la más vieja a la
 * más nueva). Cada punto trae las tasas disponibles hacia cualquier otra
 * moneda de la casa. Los días sin snapshot (fines de semana) se omiten.
 */
export async function fetchRateHistory(
  base: CurrencyCode,
  dates: string[],
): Promise<RateHistoryPoint[]> {
  const snapshots = await Promise.all(
    dates.map((date) => fetchSnapshotForDate(base, date)),
  )

  const points: RateHistoryPoint[] = []
  dates.forEach((date, index) => {
    const raw = snapshots[index]
    if (!raw) return
    const rates: Partial<Record<CurrencyCode, number>> = {}
    for (const [code, value] of Object.entries(raw)) {
      const target = code.toUpperCase() as CurrencyCode
      if ((target === 'COP' || target === 'USD' || target === 'EUR') &&
            typeof value === 'number' && value > 0) {
        rates[target] = value
      }
    }
    points.push({ date, rates })
  })

  if (points.length < 2) {
    throw new Error('No hubo datos suficientes para dibujar la tendencia')
  }
  return points
}

/** Extrae la serie de una moneda destino a partir del histórico de una base */
export function ticksFromHistory(
  history: RateHistoryPoint[],
  target: CurrencyCode,
): RateTick[] {
  return history
    .map((point) => ({
      date: point.date,
      rate: point.rates[target],
    }))
    .filter((tick): tick is RateTick => typeof tick.rate === 'number' && tick.rate > 0)
}

/** Variación porcentual entre el primer y el último punto de la serie */
export function computeDeltaPercent(ticks: RateTick[]): number {
  const first = ticks[0]
  const last = ticks[ticks.length - 1]
  return ((last.rate - first.rate) / first.rate) * 100
}

/** Texto de la variación, es-CO, con signo ("+0,45%" / "-0,30%") */
export function formatDeltaPercent(delta: number): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(2).replace('.', ',')}%`
}
