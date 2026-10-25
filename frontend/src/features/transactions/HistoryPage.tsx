import { useState } from 'react'
import { m } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateTime, formatSymbolAmount } from '@/lib/formatters'
import {
  CURRENCIES,
  type CurrencyCode,
  type Transaction,
  type TransactionFilters,
  type TransactionType,
} from '@/types/api'
import { useTransactions } from './hooks'
import {
  describeTransaction,
  TRANSACTION_STATUS_META,
  TRANSACTION_TYPE_LABELS,
  type TransactionTone,
} from './transaction.utils'

const PAGE_SIZE = 10

const TYPE_OPTIONS: TransactionType[] = [
  'deposit',
  'buy',
  'sell',
  'exchange',
  'transfer_out',
  'transfer_in',
  'payment',
]

function TransactionIcon({ tone }: { tone: TransactionTone }) {
  const styles =
    tone === 'positive'
      ? 'bg-secondary-container/20 text-secondary'
      : tone === 'negative'
        ? 'bg-error-container/20 text-error'
        : 'bg-primary-container/20 text-primary'

  const path =
    tone === 'positive'
      ? 'M12 5v14M5 12l7 7 7-7'
      : tone === 'negative'
        ? 'M12 19V5M5 12l7-7 7 7'
        : 'M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3'

  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${styles}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={path} />
      </svg>
    </span>
  )
}

function TransactionRow({ tx, index }: { tx: Transaction; index: number }) {
  const { title, tone } = describeTransaction(tx)
  const status = TRANSACTION_STATUS_META[tx.status]

  const sign = tone === 'positive' ? '+' : tone === 'negative' ? '−' : ''
  const amountColor =
    tone === 'positive' ? 'text-secondary' : 'text-on-surface'

  return (
    <m.li
      className="flex items-center gap-4 py-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: index * 0.03 }}
    >
      <TransactionIcon tone={tone} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-on-surface">{title}</p>
        <p className="truncate text-xs text-on-surface-variant">
          {formatDateTime(tx.createdAt)}
          {tx.rateUsed && tx.fromCurrency && tx.toCurrency
            ? ` · 1 ${tx.fromCurrency} = ${tx.rateUsed} ${tx.toCurrency}`
            : ''}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {tx.fromCurrency && tx.fromAmount != null ? (
          <>
            <p className={`font-display text-sm font-semibold ${amountColor}`}>
              {sign}
              {formatSymbolAmount(tx.fromAmount, tx.fromCurrency)}
            </p>
            {tx.toCurrency && tx.toAmount != null ? (
              <p className="text-xs text-on-surface-variant">
                +{formatSymbolAmount(tx.toAmount, tx.toCurrency)}
              </p>
            ) : null}
          </>
        ) : tx.toCurrency && tx.toAmount != null ? (
          <p className="font-display text-sm font-semibold text-secondary">
            +{formatSymbolAmount(tx.toAmount, tx.toCurrency)}
          </p>
        ) : null}

        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>
    </m.li>
  )
}

export default function HistoryPage() {
  const [type, setType] = useState<TransactionType | 'all'>('all')
  const [currency, setCurrency] = useState<CurrencyCode | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const filters: TransactionFilters = {}
  if (type !== 'all') filters.type = type
  if (currency !== 'all') filters.currency = currency
  if (from) filters.from = from
  if (to) filters.to = to
  if (page > 1) filters.page = page

  const query = useTransactions(filters)
  const total = query.data?.total ?? 0
  const hasPrev = page > 1
  const hasNext = page * PAGE_SIZE < total

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h2 className="font-display text-headline-md text-on-surface">
          Historial
        </h2>
        <p className="text-sm text-on-surface-variant">
          Consulta y filtra tus movimientos.
        </p>
      </header>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Tipo"
            value={type}
            onChange={(event) => {
              setType(event.target.value as TransactionType | 'all')
              setPage(1)
            }}
          >
            <option value="all">Todos</option>
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {TRANSACTION_TYPE_LABELS[option]}
              </option>
            ))}
          </Select>

          <Select
            label="Moneda"
            value={currency}
            onChange={(event) => {
              setCurrency(event.target.value as CurrencyCode | 'all')
              setPage(1)
            }}
          >
            <option value="all">Todas</option>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>

          <Input
            label="Desde"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value)
              setPage(1)
            }}
          />

          <Input
            label="Hasta"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value)
              setPage(1)
            }}
          />
        </div>
      </Card>

      <Card>
        {query.isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : query.isError ? (
          <p className="py-6 text-center text-sm text-error">
            No se pudieron cargar los movimientos.
          </p>
        ) : !query.data || query.data.data.length === 0 ? (
          <p className="py-6 text-center text-sm text-on-surface-variant">
            No hay movimientos con esos filtros.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {query.data.data.map((tx, index) => (
              <TransactionRow key={tx.id} tx={tx} index={index} />
            ))}
          </ul>
        )}
      </Card>

      {total > 0 ? (
        <div className="flex items-center justify-between text-sm text-on-surface-variant">
          <span>
            {total} movimiento{total === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!hasPrev}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </Button>
            <span className="px-1">Página {page}</span>
            <Button
              type="button"
              variant="secondary"
              disabled={!hasNext}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
