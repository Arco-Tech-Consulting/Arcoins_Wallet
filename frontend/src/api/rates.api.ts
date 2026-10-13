import { apiRequest } from './client'
import type { CurrencyCode, Rate } from '@/types/api'

export async function getRate(
  base: CurrencyCode,
  target: CurrencyCode,
): Promise<Rate> {
  const data = (await apiRequest(
    `/rates?base=${base}&target=${target}`,
  )) as Omit<Rate, 'fetchedAt'> & { fetchedAt: string }
  return {
    base: data.base,
    target: data.target,
    rate: data.rate,
    fetchedAt: data.fetchedAt,
  }
}