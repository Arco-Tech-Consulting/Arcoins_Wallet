import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { AuthService, AuthError } from './auth.service';

const mockQuery = vi.fn();
const mockConnect = vi.fn();

vi.mock('../config/db', () => ({
  pool: {
    query: (...args: unknown[]) => mockQuery(...args),
    connect: () => mockConnect(),
  },
}));

describe('AuthService', () => {
  const TEST_SECRET = 'clave-secreta-de-prueba-para-auth-service-2026';
  let authService: AuthService;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('JWT_SECRET', TEST_SECRET);
    vi.stubEnv('JWT_EXPIRES_IN', '1h');
    authService = new AuthService();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('generateToken', () => {
    it('genera un token válido decodificable con el secreto configurado', () => {
      const payload = { id: 'u1', email: 'test@example.com' };
      const token = authService.generateToken(payload);

      expect(typeof token).toBe('string');
      const decoded = jwt.verify(token, TEST_SECRET) as { id: string; email: string };
      expect(decoded.id).toBe('u1');
      expect(decoded.email).toBe('test@example.com');
    });
  });

  describe('register validation', () => {
    it('falla si faltan campos obligatorios', async () => {
      await expect(
        authService.register({ firstName: '', lastName: 'Perez', email: 'a@b.com', password: 'Password123!' })
      ).rejects.toThrow(AuthError);
    });

    it('falla si el email no es válido', async () => {
      await expect(
        authService.register({ firstName: 'Juan', lastName: 'Perez', email: 'invalid-email', password: 'Password123!' })
      ).rejects.toThrow('El formato del correo electrónico no es válido');
    });

    it('falla si la contraseña tiene menos de 8 caracteres', async () => {
      await expect(
        authService.register({ firstName: 'Juan', lastName: 'Perez', email: 'juan@test.com', password: '123' })
      ).rejects.toThrow('La contraseña debe tener al menos 8 caracteres');
    });

    it('falla si la contraseña no contiene mayúsculas', async () => {
      await expect(
        authService.register({ firstName: 'Juan', lastName: 'Perez', email: 'juan@test.com', password: 'password123!' })
      ).rejects.toThrow('La contraseña debe contener al menos una letra mayúscula');
    });

    it('falla si la contraseña no contiene minúsculas', async () => {
      await expect(
        authService.register({ firstName: 'Juan', lastName: 'Perez', email: 'juan@test.com', password: 'PASSWORD123!' })
      ).rejects.toThrow('La contraseña debe contener al menos una letra minúscula');
    });

    it('falla si la contraseña no contiene números o símbolos', async () => {
      await expect(
        authService.register({ firstName: 'Juan', lastName: 'Perez', email: 'juan@test.com', password: 'PasswordOnly' })
      ).rejects.toThrow('La contraseña debe contener al menos un número o símbolo');
    });

    it('falla si las contraseñas no coinciden', async () => {
      await expect(
        authService.register({ firstName: 'Juan', lastName: 'Perez', email: 'juan@test.com', password: 'Password123!', confirmPassword: 'Password456!' })
      ).rejects.toThrow('Las contraseñas no coinciden');
    });
  });

  describe('login validation', () => {
    it('falla si no se proporciona email o password', async () => {
      await expect(
        authService.login({ email: '', password: 'password123' })
      ).rejects.toThrow('El correo electrónico y la contraseña son requeridos');
    });

    it('falla con 401 si el usuario no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        authService.login({ email: 'noexiste@test.com', password: 'password123' })
      ).rejects.toThrow('Credenciales inválidas');
    });
  });
});
