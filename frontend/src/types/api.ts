export type CurrencyCode = 'COP' | 'USD' | 'EUR'

export const CURRENCIES: readonly CurrencyCode[] = ['COP', 'USD', 'EUR']

export type TransactionType =
  | 'deposit'
  | 'buy'
  | 'sell'
  | 'exchange'
  | 'transfer_out'
  | 'transfer_in'
  | 'payment'

export type TransactionStatus = 'pending' | 'completed' | 'failed'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface Wallet {
  id: string
}

export interface WalletBalance {
  currency: CurrencyCode
  amount: number
}

export interface Rate {
  base: CurrencyCode
  target: CurrencyCode
  rate: number
  fetchedAt: string
}

export interface Transaction {
  id: string
  type: TransactionType
  status: TransactionStatus
  fromCurrency?: CurrencyCode | null
  toCurrency?: CurrencyCode | null
  fromAmount?: number | null
  toAmount?: number | null
  rateUsed?: number | null
  rateTimestamp?: string | null
  description?: string | null
  createdAt: string
}

export interface Merchant {
  id: string
  name: string
  category: string
}

/* ---------- Requests / Responses ---------- */

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface CreateTransactionRequest {
  type: Extract<TransactionType, 'buy' | 'sell' | 'exchange'>
  fromCurrency: CurrencyCode
  toCurrency: CurrencyCode
  fromAmount: number
}

export interface CreatePaymentRequest {
  currency: CurrencyCode
  amount: number
  merchantId: string
  description?: string
}

export interface TransactionFilters {
  type?: TransactionType
  currency?: CurrencyCode
  from?: string
  to?: string
  page?: number
}

export interface PaginatedTransactions {
  data: Transaction[]
  page: number
  total: number
}

export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  reply: string
}

export interface CheckoutResponse {
  rate: Rate
  fromAmount: number
  toAmount: number
}