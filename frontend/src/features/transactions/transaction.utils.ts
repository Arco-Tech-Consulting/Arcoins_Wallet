import type {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@/types/api'

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  deposit: 'Depósito',
  buy: 'Compra de moneda',
  sell: 'Venta de moneda',
  exchange: 'Intercambio',
  transfer_out: 'Transferencia enviada',
  transfer_in: 'Transferencia recibida',
  payment: 'Pago',
}

export const TRANSACTION_STATUS_META: Record<
  TransactionStatus,
  { label: string; className: string }
> = {
  completed: {
    label: 'Completada',
    className: 'bg-secondary-container/20 text-secondary',
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-tertiary-container/30 text-tertiary',
  },
  failed: {
    label: 'Fallida',
    className: 'bg-error-container/30 text-error',
  },
}

export type TransactionTone = 'positive' | 'negative' | 'neutral'

export interface TransactionDisplay {
  title: string
  tone: TransactionTone
}

const INFLOW_TYPES: TransactionType[] = ['deposit', 'transfer_in']
const OUTFLOW_TYPES: TransactionType[] = ['payment', 'transfer_out']

/**
 * Deriva cómo mostrar un movimiento: título legible y su tono (entrada/salida).
 */
export function describeTransaction(tx: Transaction): TransactionDisplay {
  const tone: TransactionTone = INFLOW_TYPES.includes(tx.type)
    ? 'positive'
    : OUTFLOW_TYPES.includes(tx.type)
      ? 'negative'
      : 'neutral'

  return {
    title: tx.description?.trim() || TRANSACTION_TYPE_LABELS[tx.type],
    tone,
  }
}
