import { useState, type FormEvent } from 'react'
import { BalanceCards } from '@/components/BalanceCards'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useBalances } from '@/hooks/useBalances'
import { CURRENCY_META, formatSymbolAmount } from '@/lib/formatters'
import { CURRENCIES, type CurrencyCode } from '@/types/api'
import { useCreateTransfer } from './hooks'

// Misma regla del backend: formato básico de correo
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function TransferPage() {
  const { user } = useAuth()
  const [receiverEmail, setReceiverEmail] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>('COP')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const balancesQuery = useBalances()
  const createTransfer = useCreateTransfer()

  const numericAmount = Number(amount)
  const trimmedEmail = receiverEmail.trim()
  const emailInvalid = trimmedEmail.length > 0 && !EMAIL_REGEX.test(trimmedEmail)

  const currentBalance =
    balancesQuery.data?.find((b) => b.currency === currency)?.amount ?? 0

  const balanceAfter = currentBalance - (numericAmount > 0 ? numericAmount : 0)
  const hasInsufficientFunds = numericAmount > 0 && balanceAfter < 0

  const canSubmit =
    EMAIL_REGEX.test(trimmedEmail) &&
    !emailInvalid &&
    numericAmount > 0 &&
    !hasInsufficientFunds &&
    !createTransfer.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return

    createTransfer.mutate(
      {
        receiverEmail: trimmedEmail,
        currency,
        amount: numericAmount,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setReceiverEmail('')
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
          Envía fondos a otro usuario usando su correo de registro.
        </p>
        {user?.email ? (
          <p className="mt-1 text-xs text-outline">
            Para que te transfieran a ti, comparte tu correo:{' '}
            <span className="font-medium text-on-surface-variant">{user.email}</span>
          </p>
        ) : null}
      </header>

      <Card>
        <BalanceCards className="mb-5" />

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Correo del receptor */}
          <Input
            label="Correo del receptor"
            type="email"
            placeholder="receptor@correo.com"
            autoComplete="off"
            value={receiverEmail}
            onChange={(e) => setReceiverEmail(e.target.value)}
            error={
              emailInvalid
                ? 'El formato del correo electrónico no es válido'
                : undefined
            }
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
              No tienes fondos suficientes en {currency} para realizar esta transferencia.
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

      {/* Info: cómo funciona la identificación del receptor */}
      <Card>
        <h3 className="mb-2 text-sm font-semibold text-on-surface">
          ¿Cómo identifico a quien recibe?
        </h3>
        <p className="text-sm text-on-surface-variant">
          Pídele el correo con el que se registró. El dinero llega directamente a
          su billetera asociada a ese correo; no hay códigos ni números largos
          que copiar.
        </p>
      </Card>
    </section>
  )
}
