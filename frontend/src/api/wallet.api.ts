import { apiRequest } from './client'
import type { Wallet, WalletBalance } from '@/types/api'

export async function getWallet(): Promise<Wallet> {
  const data = (await apiRequest('/wallet')) as { id: string }
  return { id: data.id }
}

export async function getBalances(): Promise<WalletBalance[]> {
  const data = (await apiRequest('/wallet/balances')) as {
    data: WalletBalance[]
  }
  return data.data
}