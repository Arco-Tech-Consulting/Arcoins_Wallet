import { apiRequest } from './client'
import type { CreateDepositRequest, Transaction } from '@/types/api'

interface TransactionEnvelope {
  transaction: Transaction
}

/**
 * El endpoint de depósito recibe snake_case (`to_currency`/`to_amount`),
 * a diferencia del resto del contrato que usa camelCase. La traducción se
 * aísla aquí para que la UI trabaje siempre en camelCase.
 */
export async function createDeposit(
  body: CreateDepositRequest,
): Promise<Transaction> {
  const data = (await apiRequest('/deposit', {
    method: 'POST',
    body: {
      to_currency: body.toCurrency,
      to_amount: body.toAmount,
      description: body.description,
    },
  })) as TransactionEnvelope
  return data.transaction
}
