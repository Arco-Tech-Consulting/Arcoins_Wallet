import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { useRate } from '@/hooks/useRate'
import { formatAmount, formatRate } from '@/lib/formatters'
import { CURRENCIES, type CurrencyCode } from '@/types/api'
import { estimateBudget } from './budget.utils'

export default function BudgetPage() {
  const [tripCurrency, setTripCurrency] = useState<CurrencyCode>('USD')
  const [homeCurrency, setHomeCurrency] = useState<CurrencyCode>('COP')
  const [days, setDays] = useState('')
  const [dailyAmount, setDailyAmount] = useState('')

  const rateQuery = useRate(tripCurrency, homeCurrency)

  const sameCurrency = tripCurrency === homeCurrency
  const rate = sameCurrency ? 1 : (rateQuery.data?.rate ?? 0)

  const estimate = estimateBudget(
    { days: Number(days), dailyAmount: Number(dailyAmount) },
    tripCurrency,
    homeCurrency,
    rate,
  )

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h2 className="font-display text-headline-md text-on-surface">
          Calculadora de presupuesto
        </h2>
        <p className="text-sm text-on-surface-variant">
          Indica el destino, los días y tu gasto diario para estimar el viaje.
        </p>
      </header>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Destino"
            value={tripCurrency}
            onChange={(event) =>
              setTripCurrency(event.target.value as CurrencyCode)
            }
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>

          <Select
            label="Moneda base"
            value={homeCurrency}
            onChange={(event) =>
              setHomeCurrency(event.target.value as CurrencyCode)
            }
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>

          <Input
            label="Días"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />

          <Input
            label="Gasto diario"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={dailyAmount}
            onChange={(event) => setDailyAmount(event.target.value)}
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold text-on-surface">
          Total del viaje
        </h3>

        <p className="mt-2 font-display text-currency-display text-on-surface">
          {formatAmount(estimate.tripTotal, tripCurrency)}
        </p>

        {sameCurrency ? (
          <p className="mt-1 text-sm text-on-surface-variant">
            El destino usa tu misma moneda.
          </p>
        ) : rateQuery.isLoading ? (
          <div className="mt-1 flex items-center gap-2 text-sm text-on-surface-variant">
            <Spinner className="size-4 text-primary" />
            Calculando conversión…
          </div>
        ) : rateQuery.isError ? (
          <p className="mt-1 text-sm text-error">
            No se pudo obtener la tasa de cambio.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-on-surface-variant">
              Equivalente: {formatAmount(estimate.homeTotal, homeCurrency)}
            </p>
            {rateQuery.data ? (
              <p className="mt-0.5 text-xs text-outline">
                {formatRate(
                  rateQuery.data.rate,
                  rateQuery.data.base,
                  rateQuery.data.target,
                )}
              </p>
            ) : null}
          </>
        )}

        {estimate.days > 0 && estimate.dailyAmount > 0 ? (
          <p className="mt-3 text-sm text-on-surface-variant">
            {estimate.days} {estimate.days === 1 ? 'día' : 'días'} ·{' '}
            {formatAmount(estimate.dailyAmount, tripCurrency)} por día
          </p>
        ) : null}
      </Card>
    </section>
  )
}
