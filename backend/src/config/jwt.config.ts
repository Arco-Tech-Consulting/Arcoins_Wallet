export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

/**
 * Obtiene y valida la configuración requerida para JWT.
 * Lanza un error si JWT_SECRET no está definida en las variables de entorno.
 */
export function getJwtConfig(
  env: NodeJS.ProcessEnv = process.env,
): JwtConfig {
  const secret = env.JWT_SECRET?.trim();
  const expiresIn = env.JWT_EXPIRES_IN?.trim() || '24h';

  if (!secret) {
    throw new Error('Falta configurar JWT_SECRET en las variables de entorno.');
  }

  return { secret, expiresIn };
}
