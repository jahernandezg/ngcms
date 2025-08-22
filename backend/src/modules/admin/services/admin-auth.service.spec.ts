import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthService } from './admin-auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@cms-workspace/database';
import { AuditService } from './audit.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

interface UserDelegate {
  findUnique: jest.Mock;
  update: jest.Mock;
}
interface AuditLogDelegate { create: jest.Mock }
class PrismaMock {
  user: UserDelegate = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  auditLog: AuditLogDelegate = { create: jest.fn() };
}

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let prisma: PrismaMock;
  let jwt: JwtService;
  const jwtSecret = 'test-secret';

  beforeEach(async () => {
    prisma = new PrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        AuditService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: new JwtService({ secret: jwtSecret }) },
      ],
    }).compile();

    service = module.get(AdminAuthService);
    jwt = module.get(JwtService);
  process.env.JWT_SECRET = jwtSecret; // asegurar misma clave en verify
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('emite tokens y loguea LOGIN', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', roles: ['ADMIN'], failedAttempts: 0 });
    prisma.user.update.mockResolvedValue({});
    const spySign = jest.spyOn(jwt, 'sign');

    const tokens = await service.login('a@b.com', 'pass');
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'LOGIN' }) }));
    expect(spySign).toHaveBeenCalled();
  });

  it('lockout tras 5 fallos', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', roles: ['ADMIN'], failedAttempts: 4 });
    await expect(service.login('a@b.com', 'x')).rejects.toBeTruthy();
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ failedAttempts: 5 }) }));
  });

  it('incrementa failedAttempts en fallo < lockout', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', roles: ['ADMIN'], failedAttempts: 1 });
    await expect(service.login('a@b.com', 'x')).rejects.toBeTruthy();
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ failedAttempts: 2, lockedUntil: null }) }));
  });

  it('resetea failedAttempts y lockedUntil tras login válido', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', roles: ['ADMIN'], failedAttempts: 3, lockedUntil: null });
    prisma.user.update.mockResolvedValue({});
    await service.login('a@b.com', 'ok');
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ failedAttempts: 0, lockedUntil: null, adminLastLogin: expect.any(Date) }) }));
  });

  it('rechaza login si cuenta bloqueada', async () => {
    const future = new Date(Date.now() + 10 * 60000);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', roles: ['ADMIN'], failedAttempts: 5, lockedUntil: future });
    await expect(service.login('a@b.com', 'ok')).rejects.toBeTruthy();
    // no debe intentar update (porque se corta antes por Forbidden)
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('refresh válido emite nuevos tokens y loguea REFRESH', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', roles: ['ADMIN'] });
    const refreshToken = jwt.sign({ sub: 'u1', type: 'refresh' });
    const tokens = await service.refresh(refreshToken);
    expect(tokens).toHaveProperty('accessToken');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'REFRESH' }) }));
  });

  it('refresh inválido (tipo incorrecto) lanza Unauthorized', async () => {
    const badToken = jwt.sign({ sub: 'u1', type: 'access' });
    await expect(service.refresh(badToken)).rejects.toBeTruthy();
  });
});
