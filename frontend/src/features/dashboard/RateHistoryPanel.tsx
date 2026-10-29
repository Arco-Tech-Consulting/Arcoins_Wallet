import { useQuery } from '@tanstack/react-query'
import { m } from 'motion/react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Sparks, type SparkTone } from '@/components/Sparks'
import {
  computeDeltaPercent,
  fetchRateHistory,
  formatDeltaPercent,
  getRecentDates,
  ticksFromHistory,
  type RateTick,
} from '@/lib/market.api'
import { formatRateTimestamp } from '@/lib/formatters'
import type { CurrencyCode } from '@/types/api'
import { PAIR_LABEL } from './RatesPanel'

const HISTORY_DAYS = 7

const HISTORY_PAIRS: Array<{ base: CurrencyCode; target: CurrencyCode }> = [
  { base: 'USD', target: 'COP' },
  { base: 'EUR', target: 'COP' },
  { base: 'EUR', target: 'USD' },
]

interface PairSeries {
  label: string
  ticks: RateTick[]
  delta: number
  tone: SparkTone
}

function buildPairSeries(
  pair: { base: CurrencyCode; target: CurrencyCode },
  history: { date: string; rates: Partial<Record<CurrencyCode, number>> }[],
): PairSeries | null {
  const ticks = ticksFromHistory(history, pair.target)
  if (ticks.length < 2) return null

  const delta = computeDeltaPercent(ticks)
  return {
    label:
      PAIR_LABEL[`${pair.base}->${pair.target}`] ??
      `${pair.base} → ${pair.target}`,
    ticks,
    delta,
    tone: delta > 0.01 ? 'up' : delta < -0.01 ? 'down' : 'flat',
  }
}

export function RateHistoryPanel() {
  const dates = getRecentDates(HISTORY_DAYS)

  const usdQuery = useQuery({
    queryKey: ['rate-history', 'USD', HISTORY_DAYS],
    queryFn: () => fetchRateHistory('USD', dates),
  })
  const eurQuery = useQuery({
    queryKey: ['rate-history', 'EUR', HISTORY_DAYS],
    queryFn: () => fetchRateHistory('EUR', dates),
  })

  const loading = usdQuery.isLoading || eurQuery.isLoading
  const error = usdQuery.isError || eurQuery.isError

  const pairs = HISTORY_PAIRS.flatMap((pair) => {
    const history = pair.base === 'USD' ? usdQuery.data : eurQuery.data
    if (!history) return []
    const series = buildPairSeries(pair, history)
    return series ? [series] : []
  })

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-on-surface">
            Comportamiento de las tasas
          </h3>
          <p className="text-xs text-outline">
            Últimos {HISTORY_DAYS} días · datos diarios del mercado
          </p>
        </div>
        {loading ? <Spinner className="size-4 text-outline" /> : null}
      </div>

      {error ? (
        <p className="text-sm text-on-surface-variant">
          No pudimos obtener el historial de tasas. Intenta de nuevo.
        </p>
      ) : pairs.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Cargando tendencias…</p>
      ) : (
        <ul className="divide-y divide-outline-variant/30">
          {pairs.map((pair, index) => (
            <m.li
              key={pair.label}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease: 'easeOut',
                delay: index * 0.08,
              }}
            >
              <div className="min-w-40 flex-1">
                <p className="text-sm font-medium text-on-surface">{pair.label}</p>
                <p className="text-xs text-outline">
                  {formatRateTimestamp(`${pair.ticks[0].date}T12:00:00Z`)} →{' '}
                  <span
                    className={
                      pair.tone === 'down'
                        ? 'text-error'
                        : pair.tone === 'up'
                          ? 'text-secondary'
                          : 'text-outline'
                    }
                  >
                    {formatDeltaPercent(pair.delta)}
                  </span>{' '}
                  en {HISTORY_DAYS} días
                </p>
              </div>
              <div className="min-w-40 flex-1 sm:max-w-[45%]">
                <Sparks
                  data={pair.ticks.map((tick) => tick.rate)}
                  tone={pair.tone}
                  label={`Tendencia de ${HISTORY_DAYS} días de ${pair.label}`}
                />
              </div>
            </m.li>
          ))}
        </ul>
      )}
    </Card>
  )
}
