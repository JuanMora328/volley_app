import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '@volleyflow/shared';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.active || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }
    const safeUser = this.toSafeUser(user);
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role }),
      user: safeUser,
    };
  }

  async validateJwt(payload: JwtPayload): Promise<SafeUser> {
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.active) throw new UnauthorizedException('Sesión inválida.');
    return this.toSafeUser(user);
  }

  private toSafeUser(user: UserEntity): SafeUser {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
