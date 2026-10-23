import { Request, Response } from 'express';
import { AuthService, AuthError } from '../services/auth.service';
import { AuthenticatedRequest } from '../types/auth.types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Registro de un nuevo usuario.
   * POST /api/auth/register
   */
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, confirmPassword } = req.body;
      const firstName = req.body.firstName || req.body.first_name;
      const lastName = req.body.lastName || req.body.last_name;

      const result = await this.authService.register({
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
      });

      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error('Error en register controller:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor al registrar el usuario' });
    }
  }

  /**
   * Inicio de sesión de usuario.
   * POST /api/auth/login
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login({
        email,
        password,
      });

      res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error('Error en login controller:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor al iniciar sesión' });
    }
  }

  /**
   * Retorna los datos del usuario autenticado actual.
   * GET /api/auth/me
   */
  public async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const user = await this.authService.getCurrentUser(req.user.id);
      res.status(200).json({ user });
    } catch (error: any) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error('Error en me controller:', error);
      res.status(500).json({ error: error.message || 'Error interno al consultar el perfil' });
    }
  }
}
