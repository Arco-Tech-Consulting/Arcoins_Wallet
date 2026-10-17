import { describe, it, expect } from 'vitest';
import { getJwtConfig } from './jwt.config';

describe('getJwtConfig', () => {
  const validEnv = {
    JWT_SECRET: 'mi_secreto_para_pruebas_unitarias',
    JWT_EXPIRES_IN: '12h',
  };

  it('lee la configuración de JWT correctamente', () => {
    expect(getJwtConfig(validEnv)).toEqual({
      secret: 'mi_secreto_para_pruebas_unitarias',
      expiresIn: '12h',
    });
  });

  it('elimina espacios en blanco alrededor de las variables', () => {
    const config = getJwtConfig({
      JWT_SECRET: '   clave_con_espacios   ',
      JWT_EXPIRES_IN: '   48h   ',
    });

    expect(config.secret).toBe('clave_con_espacios');
    expect(config.expiresIn).toBe('48h');
  });

  it('utiliza 24h por defecto si JWT_EXPIRES_IN no está definido', () => {
    const config = getJwtConfig({
      JWT_SECRET: validEnv.JWT_SECRET,
    });

    expect(config.expiresIn).toBe('24h');
  });

  it.each([undefined, '', '   '])(
    'lanza un error si JWT_SECRET no está definida o está vacía: %j',
    (secret) => {
      expect(() => getJwtConfig({ JWT_SECRET: secret })).toThrow(
        'Falta configurar JWT_SECRET en las variables de entorno.'
      );
    }
  );
});
