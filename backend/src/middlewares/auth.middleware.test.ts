import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './auth.middleware';
import { AuthenticatedRequest } from '../types/auth.types';

describe('auth.middleware - authenticateToken', () => {
  const TEST_SECRET = 'clave-secreta-de-prueba-para-jwt-testing-2026';

  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', TEST_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function createMockResponse() {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
  }

  it('rechaza peticiones sin header Authorization', () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token de autenticación no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza peticiones con formato de token inválido', () => {
    const req = {
      headers: { authorization: 'Basic token123' },
    } as unknown as AuthenticatedRequest;
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Formato de token inválido. Use: Bearer <token>',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza tokens con firma inválida', () => {
    const invalidToken = jwt.sign({ id: 'user-1', email: 'test@example.com' }, 'otra-clave');
    const req = {
      headers: { authorization: `Bearer ${invalidToken}` },
    } as unknown as AuthenticatedRequest;
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza tokens expirados', () => {
    const expiredToken = jwt.sign(
      { id: 'user-1', email: 'test@example.com' },
      TEST_SECRET,
      { expiresIn: '-1s' }
    );
    const req = {
      headers: { authorization: `Bearer ${expiredToken}` },
    } as unknown as AuthenticatedRequest;
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('permite el acceso y asigna req.user si el token es válido', () => {
    const validToken = jwt.sign(
      { id: 'user-123', email: 'ana@example.com' },
      TEST_SECRET,
      { expiresIn: '1h' }
    );
    const req = {
      headers: { authorization: `Bearer ${validToken}` },
    } as unknown as AuthenticatedRequest;
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.id).toBe('user-123');
    expect(req.user?.email).toBe('ana@example.com');
  });
});
