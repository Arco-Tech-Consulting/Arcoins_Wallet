import { m } from 'motion/react'
import { useBalances } from '@/hooks/useBalances'
import { CURRENCY_META, formatSymbolAmount } from '@/lib/formatters'
import { CURRENCIES } from '@/types/api'

interface BalanceCardsProps {
  className?: string
}

export function BalanceCards({ className = '' }: BalanceCardsProps) {
  const balancesQuery = useBalances()

  return (
    <div className={`grid gap-3 sm:grid-cols-3 ${className}`}>
      {CURRENCIES.map((code, index) => {
        const value =
          balancesQuery.data?.find((balance) => balance.currency === code)
            ?.amount ?? 0

        return (
          <m.div
            key={code}
            className="rounded-lg bg-surface-container-high/50 p-3"
            initial={balancesQuery.isLoading ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.06 }}
          >
            <p className="text-xs text-on-surface-variant">
              {CURRENCY_META[code].name}
            </p>
            <p className="font-display text-lg text-on-surface">
              {balancesQuery.isLoading
                ? '—'
                : formatSymbolAmount(value, code)}
            </p>
          </m.div>
        )
      })}
    </div>
  )
}
