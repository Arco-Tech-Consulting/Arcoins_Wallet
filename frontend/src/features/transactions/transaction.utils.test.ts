import { describe, expect, it } from 'vitest'
import { describeTransaction } from './transaction.utils'
import type { Transaction } from '@/types/api'

function makeTransaction(partial: Partial<Transaction>): Transaction {
  return {
    id: 'tx_test',
    type: 'deposit',
    status: 'completed',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...partial,
  }
}

describe('describeTransaction', () => {
  it('marca los depósitos como positivos', () => {
    expect(describeTransaction(makeTransaction({ type: 'deposit' })).tone).toBe(
      'positive',
    )
  })

  it('marca los pagos como negativos', () => {
    expect(describeTransaction(makeTransaction({ type: 'payment' })).tone).toBe(
      'negative',
    )
  })

  it('marca las conversiones como neutras', () => {
    expect(describeTransaction(makeTransaction({ type: 'exchange' })).tone).toBe(
      'neutral',
    )
  })

  it('usa la descripción como título y cae al label del tipo', () => {
    expect(
      describeTransaction(makeTransaction({ description: 'Mi pago' })).title,
    ).toBe('Mi pago')

    expect(
      describeTransaction(makeTransaction({ type: 'payment', description: null }))
        .title,
    ).toBe('Pago')
  })
})
