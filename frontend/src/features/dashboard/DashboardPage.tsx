import { useQuery } from '@tanstack/react-query'
import { getBalances } from '@/api/wallet.api'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { CURRENCY_META, formatSymbolAmount } from '@/lib/formatters'
import { CURRENCIES } from '@/types/api'

export default function DashboardPage() {
  const {
    data: balances,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['balances'],
    queryFn: getBalances,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (isError || !balances) {
    return (
      <Card>
        <p className="text-ink-500">
          No se pudieron cargar los saldos. Intenta de nuevo.
        </p>
      </Card>
    )
  }

  const byCurrency = Object.fromEntries(
    balances.map((balance) => [balance.currency, balance.amount]),
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-ink-900">Dashboard</h2>
        <p className="text-sm text-ink-500">
          Tus saldos en COP, USD y EUR
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {CURRENCIES.map((currency) => {
          const amount = byCurrency[currency] ?? 0
          const meta = CURRENCY_META[currency]
          return (
            <Card key={currency} className="flex flex-col gap-1">
              <span className="text-sm text-ink-500">{meta.name}</span>
              <span className="text-2xl font-bold tracking-tight text-ink-900">
                {formatSymbolAmount(amount, currency)}
              </span>
              <span className="text-xs uppercase text-ink-400">{currency}</span>
            </Card>
          )
        })}
      </div>
    </div>
  )
}