import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPayment } from '@/api/transactions.api'
import type { CreatePaymentRequest } from '@/types/api'

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
