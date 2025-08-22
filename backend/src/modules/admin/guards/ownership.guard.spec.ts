import { OwnershipGuard } from './ownership.guard';
import { PrismaService } from '@cms-workspace/database';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface PostDelegate { findUnique: jest.Mock }
class PrismaMock { post: PostDelegate = { findUnique: jest.fn() } }

interface TestUser { sub: string; roles: string[] }
interface Params { id?: string }
const makeCtx = (user: TestUser, params: Params): ExecutionContext => ({
  switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
  getHandler: () => ({}),
  getClass: () => ({}),
  getArgs: () => [],
  getArgByIndex: () => undefined,
  switchToRpc: () => ({ getContext: () => undefined }),
  switchToWs: () => ({ getClient: () => undefined }),
  getType: () => 'http'
}) as unknown as ExecutionContext;

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard; let prisma: PrismaMock;
  beforeEach(() => {
    prisma = new PrismaMock();
    const reflectorStub: Reflector = {
      get: () => undefined,
      getAll: () => [],
      getAllAndMerge: () => [],
      getAllAndOverride: () => undefined,
      reflect: () => undefined
    } as unknown as Reflector;
  guard = new OwnershipGuard(prisma as unknown as PrismaService, reflectorStub);
  });
  it('permite admin', async () => {
    const ctx = makeCtx({ sub: 'u1', roles: ['ADMIN'] }, { id: 'p1' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
  it('lanza NotFound si no existe post', async () => {
    prisma.post.findUnique.mockResolvedValue(null);
    const ctx = makeCtx({ sub: 'u1', roles: ['AUTHOR'] }, { id: 'p1' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(NotFoundException);
  });
  it('rechaza si no owner', async () => {
    prisma.post.findUnique.mockResolvedValue({ authorId: 'other' });
    const ctx = makeCtx({ sub: 'u1', roles: ['AUTHOR'] }, { id: 'p1' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('permite owner', async () => {
    prisma.post.findUnique.mockResolvedValue({ authorId: 'u1' });
    const ctx = makeCtx({ sub: 'u1', roles: ['AUTHOR'] }, { id: 'p1' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
