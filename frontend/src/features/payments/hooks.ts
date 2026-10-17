import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMerchants } from '@/api/merchants.api'
import { createPayment } from '@/api/transactions.api'
import type { CreatePaymentRequest } from '@/types/api'

export function useMerchants() {
  return useQuery({
    queryKey: ['merchants'],
    queryFn: getMerchants,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreatePaymentRequest) => createPayment(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['balances'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
