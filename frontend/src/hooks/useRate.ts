import { useQuery } from '@tanstack/react-query'
import { getRate } from '@/api/rates.api'
import type { CurrencyCode } from '@/types/api'

export function useRate(base: CurrencyCode, target: CurrencyCode) {
  return useQuery({
    queryKey: ['rate', base, target],
    queryFn: () => getRate(base, target),
    enabled: base !== target,
  })
}
