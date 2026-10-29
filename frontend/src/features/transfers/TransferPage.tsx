import { useState, type FormEvent } from 'react'
import { BalanceCards } from '@/components/BalanceCards'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useBalances } from '@/hooks/useBalances'
import { CURRENCY_META, formatSymbolAmount } from '@/lib/formatters'
import { CURRENCIES, type CurrencyCode } from '@/types/api'
import { useCreateTransfer } from './hooks'

export default function TransferPage() {
  const [receiverWalletId, setReceiverWalletId] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>('COP')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const balancesQuery = useBalances()
  const createTransfer = useCreateTransfer()

  const numericAmount = Number(amount)

  const currentBalance =
    balancesQuery.data?.find((b) => b.currency === currency)?.amount ?? 0

  const balanceAfter = currentBalance - (numericAmount > 0 ? numericAmount : 0)
  const hasInsufficientFunds = numericAmount > 0 && balanceAfter < 0

  const canSubmit =
    receiverWalletId.trim().length > 0 &&
    numericAmount > 0 &&
    !hasInsufficientFunds &&
    !createTransfer.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return

    createTransfer.mutate(
      {
        receiverWalletId: receiverWalletId.trim(),
        currency,
        amount: numericAmount,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setReceiverWalletId('')
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
          Transferencias
        </h2>
        <p className="text-sm text-on-surface-variant">
          Enviá fondos a otro usuario usando el ID de su billetera.
        </p>
      </header>

      <Card>
        <BalanceCards className="mb-5" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ID de la billetera del receptor */}
          <Input
            label="ID de billetera del receptor"
            type="text"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={receiverWalletId}
            onChange={(e) => setReceiverWalletId(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Moneda y monto */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Moneda"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
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
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Descripción opcional */}
          <Input
            label="Descripción (opcional)"
            type="text"
            placeholder="Ej: Pago de alquiler"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Resumen de la operación */}
          <div className="rounded-lg bg-surface-container-high/60 p-4 text-sm">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Saldo actual</span>
                <span className="font-display text-on-surface">
                  {formatSymbolAmount(currentBalance, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Saldo después de enviar</span>
                <span
                  className={`font-display text-headline-md ${
                    hasInsufficientFunds ? 'text-error' : 'text-on-surface'
                  }`}
                >
                  {formatSymbolAmount(Math.max(balanceAfter, 0), currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Fondos insuficientes */}
          {hasInsufficientFunds ? (
            <p className="rounded-lg bg-error-container/30 px-3 py-2 text-sm text-on-error-container">
              No tenés fondos suficientes en {currency} para realizar esta transferencia.
            </p>
          ) : null}

          {/* Error del servidor */}
          {createTransfer.isError ? (
            <p className="rounded-lg bg-error-container/30 px-3 py-2 text-sm text-on-error-container">
              {createTransfer.error instanceof Error
                ? createTransfer.error.message
                : 'No se pudo realizar la transferencia'}
            </p>
          ) : null}

          {/* Éxito */}
          {createTransfer.isSuccess && createTransfer.data ? (
            <p className="rounded-lg bg-secondary-container/20 px-3 py-2 text-sm text-secondary">
              ✓ Transferencia realizada correctamente.{' '}
              {createTransfer.data.fromCurrency && createTransfer.data.fromAmount != null
                ? `Enviaste ${formatSymbolAmount(
                    createTransfer.data.fromAmount,
                    createTransfer.data.fromCurrency,
                  )}.`
                : ''}
            </p>
          ) : null}

          <Button type="submit" loading={createTransfer.isPending} disabled={!canSubmit}>
            Confirmar transferencia
          </Button>
        </form>
      </Card>

      {/* Info: cómo encontrar el ID de billetera */}
      <Card>
        <h3 className="mb-2 text-sm font-semibold text-on-surface">
          ¿Dónde encontrar el ID de billetera?
        </h3>
        <p className="text-sm text-on-surface-variant">
          El receptor debe compartirte su ID de billetera desde el Dashboard.
          Es un código único que identifica su cuenta y nunca cambia.
        </p>
      </Card>
    </section>
  )
}

