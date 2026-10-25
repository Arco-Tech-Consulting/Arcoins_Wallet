import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { BalanceCards } from '@/components/BalanceCards'
import { getBalances } from '@/api/wallet.api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { CURRENCY_META, formatSymbolAmount } from '@/lib/formatters'
import { CURRENCIES, type CurrencyCode } from '@/types/api'
import { useCreatePayment, useMerchants } from './hooks'
import { FALLBACK_MERCHANTS } from './merchants'

export default function PaymentsPage() {
  const [merchantId, setMerchantId] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>('COP')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const balancesQuery = useQuery({
    queryKey: ['balances'],
    queryFn: getBalances,
  })
  const merchantsQuery = useMerchants()
  const createPayment = useCreatePayment()

  const merchants = merchantsQuery.data ?? FALLBACK_MERCHANTS
  const categories = Array.from(new Set(merchants.map((m) => m.category)))
  const selectedMerchantId = merchantId || merchants[0]?.id || ''
  const merchant = merchants.find((m) => m.id === selectedMerchantId)

  const numericAmount = Number(amount)
  const balancesReady = balancesQuery.isSuccess
  const currentBalance =
    balancesQuery.data?.find((balance) => balance.currency === currency)
      ?.amount ?? 0
  const insufficient = balancesReady && numericAmount > currentBalance
  const canSubmit =
    numericAmount > 0 &&
    Boolean(selectedMerchantId) &&
    balancesReady &&
    !insufficient &&
    !createPayment.isPending

  const newBalance = Math.max(
    0,
    currentBalance - (numericAmount > 0 ? numericAmount : 0),
  )

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (numericAmount <= 0 || insufficient) return

    createPayment.mutate(
      {
        currency,
        amount: numericAmount,
        merchantId: selectedMerchantId,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setAmount('')
          setDescription('')
        },
      },
    )
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header>
        <h2 className="font-display text-headline-md text-on-surface">Pagos</h2>
        <p className="text-sm text-on-surface-variant">
          Paga a comercios descontando el saldo de tu billetera.
        </p>
      </header>

      <Card>
        <BalanceCards className="mb-5" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select
            label="Comercio"
            value={selectedMerchantId}
            onChange={(event) => setMerchantId(event.target.value)}
            disabled={merchantsQuery.isLoading}
          >
            {merchants.length === 0 ? (
              <option value="">
                {merchantsQuery.isLoading
                  ? 'Cargando comercios…'
                  : 'Sin comercios disponibles'}
              </option>
            ) : null}
            {categories.map((category) => (
              <optgroup key={category} label={category}>
                {merchants
                  .filter((m) => m.category === category)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </Select>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Moneda"
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value as CurrencyCode)
              }
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code} · {CURRENCY_META[code].name}
                </option>
              ))}
            </Select>

            <Input
              label={`Monto en ${currency}`}
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <Input
            label="Descripción (opcional)"
            type="text"
            placeholder="Ej: Almuerzo"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <div className="rounded-lg bg-surface-container-high/60 p-4 text-sm">
            {balancesQuery.isLoading ? (
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Spinner className="size-4 text-primary" />
                Cargando saldos…
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">
                    Saldo en {currency}
                  </span>
                  <span className="font-display text-on-surface">
                    {formatSymbolAmount(currentBalance, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">
                    Saldo tras el pago
                  </span>
                  <span
                    className={`font-display text-headline-md ${
                      insufficient ? 'text-error' : 'text-on-surface'
                    }`}
                  >
                    {formatSymbolAmount(newBalance, currency)}
                  </span>
                </div>
                {merchant ? (
                  <p className="text-xs text-outline">
                    {merchant.name} · {merchant.category}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {insufficient && numericAmount > 0 ? (
            <p className="rounded-lg bg-error-container/30 px-3 py-2 text-sm text-on-error-container">
              Saldo insuficiente en {currency} para este pago.
            </p>
          ) : null}

          {createPayment.isError ? (
            <p className="rounded-lg bg-error-container/30 px-3 py-2 text-sm text-on-error-container">
              {createPayment.error instanceof Error
                ? createPayment.error.message
                : 'No se pudo realizar el pago'}
            </p>
          ) : null}

          {createPayment.isSuccess && createPayment.data ? (
            <p className="rounded-lg bg-secondary-container/20 px-3 py-2 text-sm text-secondary">
              Pago realizado a {merchant?.name ?? 'el comercio'}
              {createPayment.data.fromCurrency &&
              createPayment.data.fromAmount != null
                ? ` por ${formatSymbolAmount(
                    createPayment.data.fromAmount,
                    createPayment.data.fromCurrency,
                  )}.`
                : '.'}
            </p>
          ) : null}

          <Button
            type="submit"
            loading={createPayment.isPending}
            disabled={!canSubmit}
          >
            Pagar
          </Button>
        </form>
      </Card>
    </section>
  )
}
