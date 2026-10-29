import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { type Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket, getSocket } from '@/socket/socket.client'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from './AuthContext'

/** Datos que llegan con el evento "transfer_received" */
export interface TransferNotification {
  transferGroupId: string
  currency: string
  amount: number
  description: string | null
  createdAt: string
}

interface SocketContextValue {
  /** La última notificación de transferencia recibida (null si no hay ninguna) */
  lastTransferNotification: TransferNotification | null
  /** Limpia la notificación (para que el componente la descarte tras mostrarla) */
  clearTransferNotification: () => void
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined)

/**
 * Provider que gestiona el ciclo de vida del socket:
 * - Conecta cuando el usuario está autenticado
 * - Escucha el evento "transfer_received" e invalida la cache de saldos
 * - Desconecta al hacer logout
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [lastTransferNotification, setLastTransferNotification] =
    useState<TransferNotification | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      // Si el usuario no está autenticado (o hizo logout), desconectamos
      disconnectSocket()
      socketRef.current = null
      return
    }

    // Conectamos el socket con el JWT del usuario
    const socket = connectSocket()
    socketRef.current = socket

    /**
     * Cuando llega una transferencia:
     * 1. Guardamos la notificación en el estado (para mostrar el toast)
     * 2. Invalidamos la cache de saldos para que React Query los vuelva a pedir
     * 3. Invalidamos el historial de transacciones
     */
    const handleTransferReceived = (data: TransferNotification) => {
      setLastTransferNotification(data)
      void queryClient.invalidateQueries({ queryKey: ['balances'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }

    socket.on('transfer_received', handleTransferReceived)

    return () => {
      socket.off('transfer_received', handleTransferReceived)
    }
  }, [isAuthenticated])

  const clearTransferNotification = useCallback(() => {
    setLastTransferNotification(null)
  }, [])

  return (
    <SocketContext.Provider
      value={{ lastTransferNotification, clearTransferNotification }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket debe usarse dentro de <SocketProvider>')
  }
  return context
}

