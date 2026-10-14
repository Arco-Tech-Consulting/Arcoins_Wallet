import { Spinner } from '@/components/ui/Spinner'
import { formatAmount } from '@/lib/formatters'
import { CURRENCIES, type CurrencyCode } from '@/types/api'

interface TotalBalanceCardProps {
  total: number
  reference: CurrencyCode
  loading: boolean
  timestamp?: string
  onReferenceChange: (currency: CurrencyCode) => void
}

export function TotalBalanceCard({
  total,
  reference,
  loading,
  timestamp,
  onReferenceChange,
}: TotalBalanceCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-surface-container p-6 shadow-xl">
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-outline">
            Total aproximado
          </p>
          <div className="mt-1 min-h-11">
            {loading ? (
              <div className="flex items-center">
                <Spinner className="size-6 text-primary" />
              </div>
            ) : (
              <p className="font-display text-currency-display text-on-surface">
                {formatAmount(total, reference)}
              </p>
            )}
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            {timestamp ? `Tasas del ${timestamp}` : 'Tasas en tiempo real'}
          </p>
        </div>

        <div className="flex shrink-0 gap-1 rounded-lg bg-surface-container-lowest p-1">
          {CURRENCIES.map((currency) => (
            <button
              key={currency}
              type="button"
              onClick={() => onReferenceChange(currency)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                currency === reference
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {currency}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
