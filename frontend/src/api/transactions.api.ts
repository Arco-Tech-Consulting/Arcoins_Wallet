import { apiRequest } from './client'
import type {
  CreatePaymentRequest,
  CreateTransactionRequest,
  PaginatedTransactions,
  Transaction,
  TransactionFilters,
} from '@/types/api'

interface ListEnvelope {
  data: PaginatedTransactions
}

interface TransactionEnvelope {
  transaction: Transaction
}

export async function getTransactions(
  filters: TransactionFilters = {},
): Promise<PaginatedTransactions> {
  const params = new URLSearchParams()
  if (filters.type) params.set('type', filters.type)
  if (filters.currency) params.set('currency', filters.currency)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.page) params.set('page', String(filters.page))

  const query = params.toString()
  const data = (await apiRequest(
    `/transactions${query ? `?${query}` : ''}`,
  )) as ListEnvelope
  return data.data
}

export async function createTransaction(
  body: CreateTransactionRequest,
): Promise<Transaction> {
  const data = (await apiRequest('/transactions', {
    method: 'POST',
    body,
  })) as TransactionEnvelope
  return data.transaction
}

export async function createPayment(
  body: CreatePaymentRequest,
): Promise<Transaction> {
  const data = (await apiRequest('/payments', {
    method: 'POST',
    body,
  })) as TransactionEnvelope
  return data.transaction
}