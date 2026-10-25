import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createDeposit } from '@/api/deposit.api'
import type { CreateDepositRequest } from '@/types/api'

export function useCreateDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateDepositRequest) => createDeposit(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['balances'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
