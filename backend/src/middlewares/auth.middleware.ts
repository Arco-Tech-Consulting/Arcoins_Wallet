import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload } from '../types/auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'arcoins_wallet_jwt_secret_dev_key_2026';

/**
 * Middleware para validar el token JWT en rutas protegidas.
 * Espera el header 'Authorization: Bearer <token>'.
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.status(401).json({ error: 'Token de autenticación no proporcionado' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Formato de token inválido. Use: Bearer <token>' });
    return;
  }

  const token = parts[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({ error: 'Token inválido o expirado' });
      return;
    }

    req.user = decoded as JwtPayload;
    next();
  });
}
