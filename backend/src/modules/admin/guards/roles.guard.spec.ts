import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

interface ReqUser { roles: string[] }
// Usamos any para emular ExecutionContext mínimo
interface RpcCtx { getContext: () => undefined }
interface WsCtx { getClient: () => undefined }
const ctx = (user: ReqUser): ExecutionContext => ({
  switchToHttp: () => ({ getRequest: () => ({ user }) }),
  getHandler: () => ({}),
  getClass: () => ({}),
  getArgs: () => [],
  getArgByIndex: () => undefined,
  switchToRpc: () => ({ getContext: () => undefined } as RpcCtx),
  switchToWs: () => ({ getClient: () => undefined } as WsCtx),
  getType: () => 'http'
}) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  it('permite sin roles requeridos', () => {
    const refl = { getAllAndOverride: () => undefined } as unknown as Reflector;
    const guard = new RolesGuard(refl);
  expect(guard.canActivate(ctx({ roles: [] }))).toBe(true);
  });
  it('acepta usuario con rol', () => {
    const refl = { getAllAndOverride: () => ['ADMIN'] } as unknown as Reflector;
    const guard = new RolesGuard(refl);
  expect(guard.canActivate(ctx({ roles: ['ADMIN'] }))).toBe(true);
  });
  it('rechaza sin rol', () => {
    const refl = { getAllAndOverride: () => ['ADMIN'] } as unknown as Reflector;
    const guard = new RolesGuard(refl);
  expect(() => guard.canActivate(ctx({ roles: ['AUTHOR'] }))).toThrow();
  });
});
