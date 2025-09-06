import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AdminAuthService } from '../services/admin-auth.service';

describe('authGuard', () => {
  function exec(isAuth: boolean) {
  const createUrlTree = jest.fn<UrlTree, [unknown]>((..._args: unknown[]) => ({ } as UrlTree));
    TestBed.configureTestingModule({
      providers: [
        { provide: AdminAuthService, useValue: { isAuthenticated: () => isAuth } },
        { provide: Router, useValue: { createUrlTree } }
      ]
    });
  const res = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    return { res, createUrlTree };
  }

  it('permite acceso si autenticado', () => {
    const { res, createUrlTree } = exec(true);
    expect(res).toBe(true);
    expect(createUrlTree).not.toHaveBeenCalled();
  });

  it('redirige si no autenticado', () => {
    const { res, createUrlTree } = exec(false);
  expect(createUrlTree).toHaveBeenCalledWith(['/admin/login']);
  expect(typeof res).toBe('object');
  });
});
