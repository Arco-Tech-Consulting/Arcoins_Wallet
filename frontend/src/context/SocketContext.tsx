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
import { connectSocket, disconnectSocket } from '@/socket/socket.client'
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

/** Máximo de notificaciones retenidas en memoria durante la sesión */
const MAX_NOTIFICATIONS = 30

interface SocketContextValue {
  /** La última notificación de transferencia recibida (null si no hay ninguna) */
  lastTransferNotification: TransferNotification | null
  /** Historial de notificaciones de la sesión (las más nuevas primero) */
  notifications: TransferNotification[]
  /** Cantidad de notificaciones aún no vistas por el usuario */
  unreadCount: number
  /** Limpia la notificación (para que el componente la descarte tras mostrarla) */
  clearTransferNotification: () => void
  /** Marca todas las notificaciones del centro como leídas */
  markNotificationsAsRead: () => void
  /** Borra todo el historial de notificaciones de la sesión */
  clearNotifications: () => void
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
  const [notifications, setNotifications] = useState<TransferNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      // Si el usuario no está autenticado (o hizo logout), desconectamos.
      // El historial del centro de notificaciones se limpia al remontar
      // el provider (ver key={isAuthenticated ? 'auth' : 'anon'} en main.tsx)
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
     * 2. La agregamos al historial del centro de notificaciones
     * 3. Invalidamos la cache de saldos para que React Query los vuelva a pedir
     * 4. Invalidamos el historial de transacciones
     */
    const handleTransferReceived = (data: TransferNotification) => {
      setLastTransferNotification(data)
      setNotifications((prev) =>
        [data, ...prev.filter((n) => n.transferGroupId !== data.transferGroupId)]
          .slice(0, MAX_NOTIFICATIONS),
      )
      setUnreadCount((count) => count + 1)
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

  const markNotificationsAsRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return (
    <SocketContext.Provider
      value={{
        lastTransferNotification,
        notifications,
        unreadCount,
        clearTransferNotification,
        markNotificationsAsRead,
        clearNotifications,
      }}
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
