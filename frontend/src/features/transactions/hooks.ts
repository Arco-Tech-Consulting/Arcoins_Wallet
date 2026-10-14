import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTransaction, getTransactions } from '@/api/transactions.api'
import type { CreateTransactionRequest, TransactionFilters } from '@/types/api'

export { useRate } from '@/hooks/useRate'

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => getTransactions(filters),
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateTransactionRequest) => createTransaction(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['balances'] })
    },
  })
}
