import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './environment';

const valid = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://localhost/volleyflow',
  JWT_SECRET: 'a-secure-secret-with-at-least-32-characters',
  CORS_ORIGIN: 'https://app.example.com',
};

describe('validateEnvironment', () => {
  it('acepta una configuración de producción completa', () => {
    expect(validateEnvironment({ ...valid })).toMatchObject(valid);
  });

  it('rechaza un secreto JWT débil', () => {
    expect(() => validateEnvironment({ ...valid, JWT_SECRET: 'weak' })).toThrow(
      'JWT_SECRET debe contener al menos 32 caracteres.',
    );
  });

  it('rechaza CORS abierto implícitamente en producción', () => {
    expect(() => validateEnvironment({ ...valid, CORS_ORIGIN: '' })).toThrow(
      'CORS_ORIGIN es obligatorio en producción.',
    );
  });
});
