import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { formatRate, formatRateTimestamp } from '@/lib/formatters'
import type { Rate } from '@/types/api'

const PAIR_LABEL: Record<string, string> = {
  'USD->COP': 'Dólar → Peso',
  'EUR->COP': 'Euro → Peso',
  'EUR->USD': 'Euro → Dólar',
}

interface RatesPanelProps {
  rates: Rate[]
  loading: boolean
  error: boolean
}

export function RatesPanel({ rates, loading, error }: RatesPanelProps) {
  if (error) {
    return (
      <Card>
        <h3 className="mb-1 text-sm font-semibold text-on-surface">
          Tasas de cambio
        </h3>
        <p className="text-sm text-on-surface-variant">
          No pudimos obtener las tasas. Intenta de nuevo.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-on-surface">
          Tasas de cambio
        </h3>
        {loading ? (
          <Spinner className="size-4 text-outline" />
        ) : null}
      </div>

      {rates.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Cargando tasas…</p>
      ) : (
        <ul className="divide-y divide-outline-variant/30">
          {rates.map((rate) => (
            <li
              key={`${rate.base}-${rate.target}`}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-on-surface">
                  {PAIR_LABEL[`${rate.base}->${rate.target}`] ??
                    `${rate.base} → ${rate.target}`}
                </p>
                <p className="text-xs text-outline">
                  Actualizada {formatRateTimestamp(rate.fetchedAt)}
                </p>
              </div>
              <p className="font-display text-sm font-semibold text-tertiary">
                {formatRate(rate.rate, rate.base, rate.target)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}