import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '@cms-workspace/database';
import { AuditService } from './audit.service';
import * as bcrypt from 'bcryptjs';

interface JwtPayload { sub: string; roles: string[]; email: string; }

@Injectable()
export class AdminAuthService {
  private MAX_FAILED = 5;
  private LOCK_MINUTES = 15;

  constructor(private jwt: JwtService, private prisma: PrismaService, private audit: AuditService) {}

  private buildTokens(user: User) {
    const payload: JwtPayload = { sub: user.id, roles: user.roles, email: user.email };
    const access = this.jwt.sign(payload, { expiresIn: '15m', secret: process.env.JWT_SECRET || 'dev-secret' });
    const refresh = this.jwt.sign({ sub: user.id, type: 'refresh' }, { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-secret' });
  return { accessToken: access, refreshToken: refresh, roles: user.roles };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Cuenta bloqueada temporalmente');
    }

  const valid = await bcrypt.compare(password, user.passwordHash || '');
    if (!valid) {
      const failedAttempts = (user.failedAttempts ?? 0) + 1;
      let lockedUntil: Date | null = null;
      if (failedAttempts >= this.MAX_FAILED) {
        lockedUntil = new Date(Date.now() + this.LOCK_MINUTES * 60000);
      }
      await this.prisma.user.update({ where: { id: user.id }, data: { failedAttempts, lockedUntil } });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { failedAttempts: 0, lockedUntil: null, adminLastLogin: new Date() } });

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
  const tokens = this.buildTokens(user);
  await this.audit.log({ userId: user.id, action: 'LOGIN', resource: 'User', resourceId: user.id });
  return tokens;
  }

  async refresh(token: string) {
    try {
  const decoded = this.jwt.verify(token, { secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-secret' }) as { sub: string; type: string };
      if (decoded.type !== 'refresh') throw new Error('invalid');
      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) throw new UnauthorizedException();
  const tokens = this.buildTokens(user);
  await this.audit.log({ userId: user.id, action: 'REFRESH', resource: 'User', resourceId: user.id });
  return tokens;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
