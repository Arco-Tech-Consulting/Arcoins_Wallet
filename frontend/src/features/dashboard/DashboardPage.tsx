import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getRate } from '@/api/rates.api'
import { getBalances } from '@/api/wallet.api'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import {
  CURRENCY_META,
  formatRateTimestamp,
  formatSymbolAmount,
} from '@/lib/formatters'
import { CURRENCIES, type CurrencyCode } from '@/types/api'
import { computeTotal, fetchRatesToBase } from './dashboard.utils'
import { RatesPanel } from './RatesPanel'
import { TotalBalanceCard } from './TotalBalanceCard'

const MARKET_PAIRS: Array<{ base: CurrencyCode; target: CurrencyCode }> = [
  { base: 'USD', target: 'COP' },
  { base: 'EUR', target: 'USD' },
  { base: 'EUR', target: 'COP' },
]

export default function DashboardPage() {
  const [reference, setReference] = useState<CurrencyCode>('COP')

  const balancesQuery = useQuery({
    queryKey: ['balances'],
    queryFn: getBalances,
  })

  const ratesQuery = useQuery({
    queryKey: ['rates-to', reference],
    queryFn: () => fetchRatesToBase(reference),
    enabled: Boolean(balancesQuery.data),
  })

  const marketQuery = useQuery({
    queryKey: ['market-rates'],
    queryFn: () =>
      Promise.all(
        MARKET_PAIRS.map((pair) => getRate(pair.base, pair.target)),
      ),
  })

  if (balancesQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (balancesQuery.isError || !balancesQuery.data) {
    return (
      <Card>
        <p className="text-ink-500">
          No se pudieron cargar los saldos. Intenta de nuevo.
        </p>
      </Card>
    )
  }

  const balances = balancesQuery.data
  const byCurrency = Object.fromEntries(
    balances.map((balance) => [balance.currency, balance.amount]),
  )
  const total = computeTotal(
    balances,
    ratesQuery.data ?? {},
    reference,
  )
  const latestFetched = marketQuery.data?.at(0)?.fetchedAt

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-ink-900">Dashboard</h2>
        <p className="text-sm text-ink-500">
          Tus saldos en COP, USD y EUR
        </p>
      </div>

      <TotalBalanceCard
        total={total}
        reference={reference}
        loading={Boolean(balancesQuery.data) && ratesQuery.isFetching}
        timestamp={
          latestFetched ? formatRateTimestamp(latestFetched) : undefined
        }
        onReferenceChange={setReference}
      />

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

      <RatesPanel
        rates={marketQuery.data ?? []}
        loading={marketQuery.isLoading}
        error={marketQuery.isError}
      />
    </div>
  )
}