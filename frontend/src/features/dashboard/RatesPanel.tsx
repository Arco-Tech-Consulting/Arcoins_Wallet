import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, m } from 'motion/react'
import { getRate } from '@/api/rates.api'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import {
  RateChart,
  formatDateTick,
  type RateChartTone,
} from '@/components/RateChart'
import {
  computeDeltaPercent,
  fetchRateHistory,
  formatDeltaPercent,
  getRecentDates,
  ticksFromHistory,
  type RateTick,
} from '@/lib/market.api'
import { formatRate, formatRateTimestamp } from '@/lib/formatters'
import type { CurrencyCode } from '@/types/api'

export const PAIR_LABEL: Record<string, string> = {
  'USD->COP': 'Dólar → Peso',
  'EUR->COP': 'Euro → Peso',
  'EUR->USD': 'Euro → Dólar',
}

const HISTORY_DAYS = 7

interface MarketPair {
  base: CurrencyCode
  target: CurrencyCode
}

const MARKET_PAIRS: MarketPair[] = [
  { base: 'USD', target: 'COP' },
  { base: 'EUR', target: 'COP' },
  { base: 'EUR', target: 'USD' },
]

function toneForDelta(delta: number): RateChartTone {
  if (delta > 0.01) return 'up'
  if (delta < -0.01) return 'down'
  return 'flat'
}

function TrendArrow({ tone }: { tone: RateChartTone }) {
  const paths = {
    up: 'M12 19V5m-7 7 7-7 7 7',
    down: 'M12 5v14m-7-7 7 7 7-7',
    flat: 'M5 12h14',
  } as const
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[tone]} />
    </svg>
  )
}

const BADGE_TONE: Record<RateChartTone, string> = {
  up: 'bg-secondary/10 text-secondary',
  down: 'bg-error/10 text-error',
  flat: 'bg-surface-container-high text-on-surface-variant',
}

interface PairRowProps {
  pair: MarketPair
  label: string
  liveRate: number | undefined
  liveFetchedAt: string | undefined
  ticks: RateTick[]
  historyLoading: boolean
}

function PairRow({
  pair,
  label,
  liveRate,
  liveFetchedAt,
  ticks,
  historyLoading,
}: PairRowProps) {
  const [expanded, setExpanded] = useState(false)
  const detailId = `rate-detail-${pair.base.toLowerCase()}-${pair.target.toLowerCase()}`

  const delta = ticks.length >= 2 ? computeDeltaPercent(ticks) : null
  const tone = delta === null ? 'flat' : toneForDelta(delta)
  const canExpand = ticks.length >= 2
  const rates = ticks.map((tick) => tick.rate)
  const weekMin = Math.min(...rates)
  const weekMax = Math.max(...rates)

  function toggleExpanded() {
    if (canExpand || expanded) setExpanded((open) => !open)
  }

  return (
    <li className="py-1">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailId}
        aria-disabled={!canExpand}
        onClick={toggleExpanded}
        className="-mx-2 w-[calc(100%+1rem)] rounded-xl px-2 py-3 text-left transition-colors hover:bg-surface-container-high/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="min-w-40 flex-1">
            <p className="text-sm font-medium text-on-surface">{label}</p>
            {liveRate !== undefined ? (
              <>
                <p className="font-display text-sm font-semibold text-tertiary">
                  {formatRate(liveRate, pair.base, pair.target)}
                </p>
                <p className="text-xs text-outline">
                  Actualizada{' '}
                  {liveFetchedAt ? formatRateTimestamp(liveFetchedAt) : '—'}
                </p>
              </>
            ) : (
              <p className="text-sm text-on-surface-variant">Cargando tasa…</p>
            )}
          </div>

          {delta !== null ? (
            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_TONE[tone]}`}
            >
              <TrendArrow tone={tone} />
              {formatDeltaPercent(delta)}
            </span>
          ) : historyLoading ? (
            <span className="inline-flex w-fit items-center gap-2 text-xs text-outline">
              <Spinner className="size-3.5" />
              Tendencia…
            </span>
          ) : (
            <span className="text-xs text-on-surface-variant/80">
              Tendencia no disponible
            </span>
          )}

          <div className="w-full shrink-0 sm:w-44">
            {ticks.length >= 2 ? (
              <RateChart
                series={ticks}
                tone={tone}
                label={`Tendencia de ${HISTORY_DAYS} días de ${label}`}
              />
            ) : historyLoading ? (
              <div className="h-12 animate-pulse rounded-lg bg-surface-container-high/70" />
            ) : null}
          </div>

          {canExpand ? (
            <svg
              viewBox="0 0 24 24"
              className={`mx-auto hidden size-4 shrink-0 text-on-surface-variant transition-transform sm:block ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          ) : null}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && canExpand ? (
          <m.div
            id={detailId}
            role="region"
            aria-label={`${label}, detalle de la semana`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-2 pt-2 pb-4">
              <RateChart
                series={ticks}
                tone={tone}
                variant="detail"
                label={`Detalle de ${HISTORY_DAYS} días de ${label}`}
                formatValue={(value) => formatRate(value, pair.base, pair.target)}
              />
              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div>
                  <dt className="text-outline">Mínimo</dt>
                  <dd className="font-medium text-on-surface">
                    {formatRate(weekMin, pair.base, pair.target)}
                  </dd>
                </div>
                <div>
                  <dt className="text-outline">Máximo</dt>
                  <dd className="font-medium text-on-surface">
                    {formatRate(weekMax, pair.base, pair.target)}
                  </dd>
                </div>
                <div>
                  <dt className="text-outline">Variación</dt>
                  <dd className={`font-medium ${tone === 'up' ? 'text-secondary' : tone === 'down' ? 'text-error' : 'text-on-surface'}`}>
                    {formatDeltaPercent(delta ?? 0)} en {HISTORY_DAYS} días
                  </dd>
                </div>
                <div>
                  <dt className="text-outline">Rango</dt>
                  <dd className="font-medium text-on-surface">
                    {formatDateTick(ticks[0].date)} → {formatDateTick(ticks[ticks.length - 1].date)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-[11px] text-outline">
                Datos diarios del mercado. Línea punteada: valor del primer día.
              </p>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </li>
  )
}

/**
 * Sección única de tasas de cambio: por cada par muestra la tasa viva del
 * backend, la variación de los últimos 7 días y una gráfica compacta que
 * se expande con el detalle completo de la semana.
 */
export function RatesPanel() {
  const dates = getRecentDates(HISTORY_DAYS)

  const marketQuery = useQuery({
    queryKey: ['market-rates'],
    queryFn: () =>
      Promise.all(
        MARKET_PAIRS.map((pair) => getRate(pair.base, pair.target)),
      ),
  })

  const usdHistoryQuery = useQuery({
    queryKey: ['rate-history', 'USD', HISTORY_DAYS],
    queryFn: () => fetchRateHistory('USD', dates),
  })
  const eurHistoryQuery = useQuery({
    queryKey: ['rate-history', 'EUR', HISTORY_DAYS],
    queryFn: () => fetchRateHistory('EUR', dates),
  })

  const latestFetched = marketQuery.data?.at(0)?.fetchedAt
  const liveByPair = new Map(
    (marketQuery.data ?? []).map((rate) => [`${rate.base}-${rate.target}`, rate]),
  )

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-on-surface">
            Tasas de cambio
          </h3>
          <p className="text-xs text-outline">
            {latestFetched
              ? `Del mercado · actualizadas ${formatRateTimestamp(latestFetched)}`
              : 'Del mercado'}
          </p>
        </div>
        {marketQuery.isFetching ? <Spinner className="size-4 text-outline" /> : null}
      </div>

      {marketQuery.isError ? (
        <p className="py-2 text-sm text-on-surface-variant">
          No pudimos obtener las tasas. Intenta de nuevo.
        </p>
      ) : marketQuery.isLoading ? (
        <p className="py-2 text-sm text-on-surface-variant">Cargando tasas…</p>
      ) : (
        <ul className="divide-y divide-outline-variant/30">
          {MARKET_PAIRS.map((pair) => {
            const history =
              pair.base === 'USD' ? usdHistoryQuery.data : eurHistoryQuery.data
            const historyLoading =
              pair.base === 'USD'
                ? usdHistoryQuery.isLoading
                : eurHistoryQuery.isLoading
            const live = liveByPair.get(`${pair.base}-${pair.target}`)

            return (
              <PairRow
                key={`${pair.base}-${pair.target}`}
                pair={pair}
                label={
                  PAIR_LABEL[`${pair.base}->${pair.target}`] ??
                  `${pair.base} → ${pair.target}`
                }
                liveRate={live?.rate}
                liveFetchedAt={live?.fetchedAt}
                ticks={history ? ticksFromHistory(history, pair.target) : []}
                historyLoading={historyLoading}
              />
            )
          })}
        </ul>
      )}
    </Card>
  )
}
