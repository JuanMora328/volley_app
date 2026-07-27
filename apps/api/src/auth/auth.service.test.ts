import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@volleyflow/shared';
import * as argon2 from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

const baseUser = {
  id: 'u1',
  name: 'Admin',
  email: 'admin@volleyflow.local',
  role: UserRole.ADMIN,
  active: true,
};

describe('AuthService', () => {
  let repo: { findOne: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    repo = { findOne: vi.fn() };
    service = new AuthService(
      repo as never,
      { signAsync: vi.fn().mockResolvedValue('jwt') } as never,
    );
  });

  it('retorna usuario y token en login exitoso', async () => {
    const user = { ...baseUser, passwordHash: await argon2.hash('Cambiar123!') };
    repo.findOne.mockResolvedValue(user);
    await expect(service.login('ADMIN@volleyflow.local', 'Cambiar123!')).resolves.toMatchObject({
      accessToken: 'jwt',
      user: { email: user.email },
    });
  });

  it('rechaza credenciales incorrectas', async () => {
    const user = { ...baseUser, passwordHash: await argon2.hash('Cambiar123!') };
    repo.findOne.mockResolvedValue(user);
    await expect(service.login(user.email, 'incorrecta')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza usuarios inactivos', async () => {
    const user = { ...baseUser, passwordHash: await argon2.hash('Cambiar123!'), active: false };
    repo.findOne.mockResolvedValue(user);
    await expect(service.login(user.email, 'Cambiar123!')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('valida JWT contra usuario activo', async () => {
    const user = { ...baseUser, passwordHash: await argon2.hash('Cambiar123!') };
    repo.findOne.mockResolvedValue(user);
    await expect(
      service.validateJwt({ sub: user.id, email: user.email, role: user.role }),
    ).resolves.toMatchObject({ id: user.id });
  });
});
