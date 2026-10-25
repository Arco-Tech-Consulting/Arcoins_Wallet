import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { m } from 'motion/react'
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
        <p className="text-on-surface-variant">
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
        <h2 className="font-display text-headline-md text-on-surface">Dashboard</h2>
        <p className="text-sm text-on-surface-variant">
          Tus saldos en COP, USD y EUR
        </p>
      </div>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <TotalBalanceCard
          total={total}
          reference={reference}
          loading={Boolean(balancesQuery.data) && ratesQuery.isFetching}
          timestamp={
            latestFetched ? formatRateTimestamp(latestFetched) : undefined
          }
          onReferenceChange={setReference}
        />
      </m.div>

      <div className="grid gap-4 sm:grid-cols-3">
        {CURRENCIES.map((currency, index) => {
          const amount = byCurrency[currency] ?? 0
          const meta = CURRENCY_META[currency]
          return (
            <m.div
              key={currency}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease: 'easeOut',
                delay: 0.1 + index * 0.06,
              }}
            >
              <Card className="flex h-full flex-col gap-1">
                <span className="text-sm text-on-surface-variant">
                  {meta.name}
                </span>
                <span className="font-display text-headline-md text-on-surface">
                  {formatSymbolAmount(amount, currency)}
                </span>
                <span className="text-xs uppercase text-outline">{currency}</span>
              </Card>
            </m.div>
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