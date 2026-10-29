import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { m } from 'motion/react'
import { getRate } from '@/api/rates.api'
import { getBalances, getWallet } from '@/api/wallet.api'
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
  const [copied, setCopied] = useState(false)

  const balancesQuery = useQuery({
    queryKey: ['balances'],
    queryFn: getBalances,
  })

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
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

  function handleCopyWalletId() {
    const walletId = walletQuery.data?.id
    if (!walletId) return
    navigator.clipboard.writeText(walletId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

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

      {/* ID de billetera copiable — necesario para recibir transferencias */}
      <Card>
        <p className="mb-2 text-xs uppercase tracking-wider text-outline">
          Tu ID de billetera
        </p>
        <div className="flex items-center gap-3">
          {walletQuery.isLoading ? (
            <Spinner className="size-4 text-primary" />
          ) : walletQuery.data ? (
            <>
              <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-surface-container-highest px-3 py-2 font-mono text-sm text-on-surface">
                {walletQuery.data.id}
              </code>
              <button
                type="button"
                onClick={handleCopyWalletId}
                aria-label="Copiar ID de billetera"
                title="Copiar ID de billetera"
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-surface-container-high px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-bright hover:text-on-surface"
              >
                {copied ? (
                  <>
                    <svg viewBox="0 0 24 24" className="size-4 text-secondary" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span className="text-secondary">Copiado</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    Copiar
                  </>
                )}
              </button>
            </>
          ) : (
            <p className="text-sm text-on-surface-variant">No disponible</p>
          )}
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          Compartí este ID para que otros usuarios puedan enviarte transferencias.
        </p>
      </Card>

      {/* Sección única: tasa viva + tendencia de 7 días expandible */}
      <RatesPanel />
    </div>
  )
}
