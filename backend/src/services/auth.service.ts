import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import {
  AuthResponse,
  JwtPayload,
  LoginDto,
  RegisterDto,
  UserResponse,
} from '../types/auth.types';
import { getJwtConfig } from '../config/jwt.config';

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  /**
   * Genera un token JWT firmado.
   */
  public generateToken(payload: JwtPayload): string {
    const { secret, expiresIn } = getJwtConfig();
    return jwt.sign(payload, secret, {
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Valida el formato de correo electrónico.
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Registra un nuevo usuario, crea su billetera y sus saldos iniciales en 0.
   */
  public async register(dto: RegisterDto): Promise<AuthResponse> {
    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;
    const confirmPassword = dto.confirmPassword;

    if (!firstName || !lastName || !email || !password) {
      throw new AuthError('Todos los campos son requeridos (nombre, apellido, email, contraseña)', 400);
    }

    if (!this.isValidEmail(email)) {
      throw new AuthError('El formato del correo electrónico no es válido', 400);
    }

    if (confirmPassword !== undefined && confirmPassword !== password) {
      throw new AuthError('Las contraseñas no coinciden', 400);
    }

    if (password.length < 8) {
      throw new AuthError('La contraseña debe tener al menos 8 caracteres', 400);
    }

    if (!/[A-Z]/.test(password)) {
      throw new AuthError('La contraseña debe contener al menos una letra mayúscula', 400);
    }

    if (!/[a-z]/.test(password)) {
      throw new AuthError('La contraseña debe contener al menos una letra minúscula', 400);
    }

    if (!/[0-9\W_]/.test(password)) {
      throw new AuthError('La contraseña debe contener al menos un número o símbolo', 400);
    }

    // Verificar si el usuario ya existe
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existing.rows.length > 0) {
      throw new AuthError('El correo electrónico ya se encuentra registrado', 409);
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Iniciar transacción para crear usuario, wallet y saldos iniciales
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Crear usuario
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, first_name, last_name`,
        [email, passwordHash, firstName, lastName]
      );
      const user = userResult.rows[0];

      // 2. Crear billetera vinculada al usuario
      const walletResult = await client.query(
        `INSERT INTO wallets (user_id)
         VALUES ($1)
         RETURNING id`,
        [user.id]
      );
      const walletId = walletResult.rows[0].id;

      // 3. Inicializar saldos en 0 para las monedas soportadas
      await client.query(
        `INSERT INTO wallet_balances (wallet_id, currency, amount)
         VALUES 
           ($1, 'COP', 0),
           ($1, 'USD', 0),
           ($1, 'EUR', 0)`,
        [walletId]
      );

      const userResponse: UserResponse = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      };

      const token = this.generateToken({ id: user.id, email: user.email });

      await client.query('COMMIT');

      return {
        token,
        user: userResponse,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Autentica a un usuario y genera un token JWT.
   */
  public async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;

    if (!email || !password) {
      throw new AuthError('El correo electrónico y la contraseña son requeridos', 400);
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, first_name, last_name, is_active
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AuthError('Credenciales inválidas', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AuthError('La cuenta se encuentra inactiva. Contacte al soporte.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthError('Credenciales inválidas', 401);
    }

    const userResponse: UserResponse = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    };

    const token = this.generateToken({ id: user.id, email: user.email });

    return {
      token,
      user: userResponse,
    };
  }

  /**
   * Obtiene la información del usuario autenticado actual.
   */
  public async getCurrentUser(userId: string): Promise<UserResponse> {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, is_active
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AuthError('Usuario no encontrado', 404);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AuthError('La cuenta se encuentra inactiva', 403);
    }

    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    };
  }
}
