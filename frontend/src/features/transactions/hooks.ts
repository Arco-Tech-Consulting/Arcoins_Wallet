import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRate } from '@/api/rates.api'
import { createTransaction, getTransactions } from '@/api/transactions.api'
import type {
  CreateTransactionRequest,
  CurrencyCode,
  TransactionFilters,
} from '@/types/api'

export function useRate(base: CurrencyCode, target: CurrencyCode) {
  return useQuery({
    queryKey: ['rate', base, target],
    queryFn: () => getRate(base, target),
    enabled: base !== target,
  })
}

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
