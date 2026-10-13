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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-100">
            Total aproximado
          </p>
          <div className="mt-2 min-h-11">
            {loading ? (
              <div className="flex items-center">
                <Spinner className="size-6" />
              </div>
            ) : (
              <p className="text-3xl font-bold tracking-tight">
                {formatAmount(total, reference)}
              </p>
            )}
          </div>
          <p className="mt-1 text-xs text-brand-200">
            {timestamp ? `Tasas del ${timestamp}` : 'Tasas en tiempo real'}
          </p>
        </div>

        <div className="flex shrink-0 gap-1 rounded-lg bg-brand-950/40 p-1">
          {CURRENCIES.map((currency) => (
            <button
              key={currency}
              type="button"
              onClick={() => onReferenceChange(currency)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                currency === reference
                  ? 'bg-white text-brand-900'
                  : 'text-brand-100 hover:bg-brand-900/40'
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