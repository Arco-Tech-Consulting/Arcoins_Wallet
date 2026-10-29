import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getJwtConfig } from '../config/jwt.config';
import { JwtPayload } from '../types/auth.types';

/**
 * Mapa que asocia cada userId con su socketId activo.
 * Permite emitir eventos a un usuario específico sin importar
 * desde qué conexión esté conectado.
 */
const userSocketMap = new Map<string, string>();

let io: SocketServer;

/**
 * Inicializa el servidor de Socket.io sobre el servidor HTTP de Express.
 * Autentica cada conexión validando el JWT enviado como query param.
 */
export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
    },
    // Permite Long Polling como fallback si WebSocket no está disponible.
    // Esto es importante para el plan gratuito de Render.
    transports: ['polling', 'websocket'],
  });

  // Middleware de autenticación: se ejecuta antes de establecer la conexión.
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('Token de autenticación requerido'));
    }

    try {
      const { secret } = getJwtConfig();
      const decoded = jwt.verify(token, secret) as JwtPayload;
      // Guardamos el payload en el socket para usarlo en los eventos
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Token inválido o expirado'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;
    const userId = user.id;

    // Registramos el socket del usuario en el mapa
    userSocketMap.set(userId, socket.id);
    console.log(`[Socket.io] Usuario ${userId} conectado (socket: ${socket.id})`);

    socket.on('disconnect', () => {
      // Solo eliminamos si sigue siendo el mismo socket (evita race conditions)
      if (userSocketMap.get(userId) === socket.id) {
        userSocketMap.delete(userId);
      }
      console.log(`[Socket.io] Usuario ${userId} desconectado`);
    });
  });

  return io;
}

/**
 * Emite un evento a un usuario específico por su userId.
 * Si el usuario no está conectado, el evento se descarta silenciosamente
 * (esto es intencional: el saldo se actualiza en el próximo login).
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) {
    console.warn('[Socket.io] El servidor no está inicializado.');
    return;
  }

  const socketId = userSocketMap.get(userId);
  if (!socketId) {
    // El usuario no está conectado en este momento, no es un error
    return;
  }

  io.to(socketId).emit(event, data);
  console.log(`[Socket.io] Evento "${event}" emitido a usuario ${userId}`);
}

export { io };

