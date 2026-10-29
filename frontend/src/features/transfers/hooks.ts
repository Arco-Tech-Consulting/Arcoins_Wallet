import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTransfer } from '@/api/transfers.api'
import type { CreateTransferRequest } from '@/types/api'

export function useCreateTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateTransferRequest) => createTransfer(body),
    onSuccess: () => {
      // Actualizamos saldos e historial del emisor inmediatamente
      void queryClient.invalidateQueries({ queryKey: ['balances'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

