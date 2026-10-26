import { useState, type FormEvent } from 'react'
import { BalanceCards } from '@/components/BalanceCards'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { useBalances } from '@/hooks/useBalances'
import { CURRENCY_META, formatSymbolAmount } from '@/lib/formatters'
import { CURRENCIES, type CurrencyCode } from '@/types/api'
import { useCreateDeposit } from './hooks'

export default function DepositPage() {
  const [currency, setCurrency] = useState<CurrencyCode>('COP')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const balancesQuery = useBalances()
  const createDeposit = useCreateDeposit()

  const numericAmount = Number(amount)
  const canSubmit = numericAmount > 0 && !createDeposit.isPending

  const currentBalance =
    balancesQuery.data?.find((balance) => balance.currency === currency)
      ?.amount ?? 0
  const newBalance = currentBalance + (numericAmount > 0 ? numericAmount : 0)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (numericAmount <= 0) return

    createDeposit.mutate(
      {
        toCurrency: currency,
        toAmount: numericAmount,
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
        <h2 className="font-display text-headline-md text-on-surface">
          Depósito
        </h2>
        <p className="text-sm text-on-surface-variant">
          Agrega saldo a tu billetera en COP, USD o EUR.
        </p>
      </header>

      <Card>
        <BalanceCards className="mb-5" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            placeholder="Ej: Recarga inicial"
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
                  <span className="text-on-surface-variant">Saldo actual</span>
                  <span className="font-display text-on-surface">
                    {formatSymbolAmount(currentBalance, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Nuevo saldo</span>
                  <span className="font-display text-headline-md text-secondary">
                    {formatSymbolAmount(newBalance, currency)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {createDeposit.isError ? (
            <p className="rounded-lg bg-error-container/30 px-3 py-2 text-sm text-on-error-container">
              {createDeposit.error instanceof Error
                ? createDeposit.error.message
                : 'No se pudo realizar el depósito'}
            </p>
          ) : null}

          {createDeposit.isSuccess && createDeposit.data ? (
            <p className="rounded-lg bg-secondary-container/20 px-3 py-2 text-sm text-secondary">
              Depósito realizado.{' '}
              {createDeposit.data.toCurrency && createDeposit.data.toAmount != null
                ? `Acreditamos ${formatSymbolAmount(
                    createDeposit.data.toAmount,
                    createDeposit.data.toCurrency,
                  )}.`
                : 'Saldo acreditado.'}
            </p>
          ) : null}

          <Button type="submit" loading={createDeposit.isPending} disabled={!canSubmit}>
            Depositar
          </Button>
        </form>
      </Card>
    </section>
  )
}
