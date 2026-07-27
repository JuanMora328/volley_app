import { describe, expect, it } from 'vitest';
import { loginSchema } from '../auth-validation';

describe('validaciones de login', () => {
  it('rechaza correos inválidos y contraseñas cortas', () => {
    const result = loginSchema.safeParse({ email: 'correo', password: '123' });
    expect(result.success).toBe(false);
  });

  it('acepta credenciales con formato válido', () => {
    const result = loginSchema.safeParse({
      email: 'admin@volleyflow.local',
      password: 'Cambiar123!',
    });
    expect(result.success).toBe(true);
  });
});
