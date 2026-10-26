import { useQuery } from '@tanstack/react-query'
import { getBalances } from '@/api/wallet.api'

export function useBalances() {
  return useQuery({
    queryKey: ['balances'],
    queryFn: getBalances,
  })
}
