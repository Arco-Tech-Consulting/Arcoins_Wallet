import { apiRequest } from './client'
import type { Merchant } from '@/types/api'

interface MerchantsEnvelope {
  data: Merchant[]
}

export async function getMerchants(): Promise<Merchant[]> {
  const data = (await apiRequest('/merchants')) as MerchantsEnvelope
  return data.data
}
