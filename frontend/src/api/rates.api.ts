import { apiRequest } from './client'
import type { CurrencyCode, Rate } from '@/types/api'

export async function getRate(
  base: CurrencyCode,
  target: CurrencyCode,
): Promise<Rate> {
  const data = await apiRequest(`/rates?base=${base}&target=${target}`)
  return data as Rate
}