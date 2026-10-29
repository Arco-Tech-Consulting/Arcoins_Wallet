import { apiRequest } from './client'
import type { CreateTransferRequest, Transaction } from '@/types/api'

interface TransferEnvelope {
  success: boolean
  transaction: Transaction
  transferGroupId: string
}

/**
 * Llama al endpoint POST /api/transfers para ejecutar una transferencia.
 * El dinero se mueve por HTTP (no por socket): es seguro y atómico.
 */
export async function createTransfer(
  body: CreateTransferRequest,
): Promise<Transaction> {
  const data = (await apiRequest('/transfers', {
    method: 'POST',
    body,
  })) as TransferEnvelope
  return data.transaction
}

