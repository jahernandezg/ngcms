import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { loginRedirectGuard } from './login-redirect.guard';
import { AdminAuthService } from '../services/admin-auth.service';

describe('loginRedirectGuard', () => {
  function exec(isAuth: boolean) {
    const createUrlTree = jest.fn<UrlTree, [unknown]>((..._args: unknown[]) => ({} as UrlTree));
    TestBed.configureTestingModule({
      providers: [
        { provide: AdminAuthService, useValue: { isAuthenticated: () => isAuth } },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
  const res = TestBed.runInInjectionContext(() => loginRedirectGuard({} as never, {} as never));
    return { res, createUrlTree };
  }

  it('redirige a dashboard si ya autenticado', () => {
    const { res, createUrlTree } = exec(true);
    expect(createUrlTree).toHaveBeenCalledWith(['/admin', 'dashboard']);
    expect(typeof res).toBe('object');
  });

  it('permite continuar si no autenticado', () => {
    const { res, createUrlTree } = exec(false);
    expect(res).toBe(true);
    expect(createUrlTree).not.toHaveBeenCalled();
  });
});
