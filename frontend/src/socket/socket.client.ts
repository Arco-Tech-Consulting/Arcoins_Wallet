import { io, Socket } from 'socket.io-client'
import { getToken } from '@/api/client'

// En desarrollo usa localhost; en producción usa VITE_SOCKET_URL
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000'

let socket: Socket | null = null

/**
 * Crea y conecta el socket autenticándose con el JWT del usuario.
 * Si ya existe una conexión activa, no crea una nueva.
 */
export function connectSocket(): Socket {
  if (socket?.connected) return socket

  const token = getToken()

  socket = io(SOCKET_URL, {
    auth: { token },
    // Intenta polling primero (más compatible con Render Free),
    // luego hace upgrade a WebSocket si es posible.
    transports: ['polling', 'websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => {
    console.log('[Socket.io] Conectado al servidor')
  })

  socket.on('connect_error', (err) => {
    console.warn('[Socket.io] Error de conexión:', err.message)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket.io] Desconectado:', reason)
  })

  return socket
}

/**
 * Desconecta el socket activo y lo limpia.
 * Se llama al hacer logout.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Retorna el socket activo (puede ser null si no se conectó).
 */
export function getSocket(): Socket | null {
  return socket
}

