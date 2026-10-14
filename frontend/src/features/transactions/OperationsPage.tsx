import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  CURRENCY_META,
  formatRateTimestamp,
  formatSymbolAmount,
} from '@/lib/formatters'
import { CURRENCIES, type CurrencyCode } from '@/types/api'
import { useCreateTransaction, useRate } from './hooks'

type OperationType = 'buy' | 'sell' | 'exchange'

const OPERATION_TABS: Array<{
  type: OperationType
  label: string
  hint: string
}> = [
  { type: 'buy', label: 'Comprar', hint: 'Compra una moneda pagando con otra.' },
  { type: 'sell', label: 'Vender', hint: 'Vende una moneda para recibir otra.' },
  {
    type: 'exchange',
    label: 'Intercambiar',
    hint: 'Convierte directamente entre dos monedas.',
  },
]

function formatRatePreview(
  rate: number,
  base: CurrencyCode,
  target: CurrencyCode,
): string {
  const value = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 6,
  }).format(rate)
  return `1 ${base} = ${value} ${target}`
}

export default function OperationsPage() {
  const [type, setType] = useState<OperationType>('buy')
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('COP')
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('USD')
  const [amount, setAmount] = useState('')

  const numericAmount = Number(amount)
  const sameCurrency = fromCurrency === toCurrency
  const canSubmit = !sameCurrency && numericAmount > 0

  const rateQuery = useRate(fromCurrency, toCurrency)
  const createTx = useCreateTransaction()

  const rate = rateQuery.data
  const converted = rate ? numericAmount * rate.rate : 0
  const activeTab = OPERATION_TABS.find((tab) => tab.type === type)

  function handleSwap() {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    createTx.mutate(
      {
        type,
        fromCurrency,
        toCurrency,
        fromAmount: numericAmount,
      },
      { onSuccess: () => setAmount('') },
    )
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header>
        <h2 className="font-display text-headline-md text-on-surface">
          Operaciones
        </h2>
        <p className="text-sm text-on-surface-variant">
          Compra, vende o intercambia entre COP, USD y EUR.
        </p>
      </header>

      <Card>
        <div className="mb-4 inline-flex rounded-lg bg-surface-container-lowest p-1">
          {OPERATION_TABS.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => setType(tab.type)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab.type === type
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="mb-4 text-sm text-on-surface-variant">{activeTab?.hint}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <Select
              label="Entregás"
              value={fromCurrency}
              onChange={(event) =>
                setFromCurrency(event.target.value as CurrencyCode)
              }
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code} · {CURRENCY_META[code].name}
                </option>
              ))}
            </Select>

            <button
              type="button"
              onClick={handleSwap}
              aria-label="Invertir monedas"
              title="Invertir monedas"
              className="mb-1 flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant transition-colors hover:bg-surface-bright hover:text-on-surface"
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
                <path d="M7 4v13M4 14l3 3 3-3M17 20V7M14 10l3-3 3 3" />
              </svg>
            </button>

            <Select
              label="Recibís"
              value={toCurrency}
              onChange={(event) =>
                setToCurrency(event.target.value as CurrencyCode)
              }
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code} · {CURRENCY_META[code].name}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label={`Monto en ${fromCurrency}`}
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />

          <div className="rounded-lg bg-surface-container-high/60 p-4 text-sm">
            {sameCurrency ? (
              <p className="text-on-surface-variant">
                Elegí dos monedas distintas para ver la tasa.
              </p>
            ) : rateQuery.isLoading ? (
              <p className="text-on-surface-variant">Obteniendo tasa…</p>
            ) : rateQuery.isError || !rate ? (
              <p className="text-error">No se pudo obtener la tasa.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Tasa</span>
                  <span className="font-display font-semibold text-tertiary">
                    {formatRatePreview(rate.rate, rate.base, rate.target)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Recibís</span>
                  <span className="font-display text-headline-md text-on-surface">
                    {formatSymbolAmount(converted, toCurrency)}
                  </span>
                </div>
                <p className="text-xs text-outline">
                  Tasa del {formatRateTimestamp(rate.fetchedAt)}
                </p>
              </div>
            )}
          </div>

          {createTx.isError ? (
            <p className="rounded-lg bg-error-container/30 px-3 py-2 text-sm text-on-error-container">
              {createTx.error instanceof Error
                ? createTx.error.message
                : 'No se pudo realizar la operación'}
            </p>
          ) : null}

          {createTx.isSuccess && createTx.data ? (
            <p className="rounded-lg bg-secondary-container/20 px-3 py-2 text-sm text-secondary">
              Operación realizada. Recibiste{' '}
              {createTx.data.toCurrency && createTx.data.toAmount != null
                ? formatSymbolAmount(
                    createTx.data.toAmount,
                    createTx.data.toCurrency,
                  )
                : 'el monto solicitado'}
              .
            </p>
          ) : null}

          <Button
            type="submit"
            loading={createTx.isPending}
            disabled={!canSubmit}
          >
            Confirmar operación
          </Button>
        </form>
      </Card>
    </section>
  )
}
