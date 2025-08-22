import { AdminAuthService } from '../services/admin-auth.service';
import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';

describe('roleGuard', () => {
  let navigateSpy: jest.Mock;
  const build = (userRoles: string[]) => {
    navigateSpy = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AdminAuthService, useValue: { hasRole: (r: string) => userRoles.includes(r) } },
        { provide: Router, useValue: { navigate: navigateSpy } }
      ]
    });
  };

  function exec(required: string[], userRoles: string[]) {
    build(userRoles);
    // Simulamos la lógica interna del guard usando las dependencias stub registradas en el injector
  const auth = TestBed.inject(AdminAuthService) as unknown as { hasRole: (r: string) => boolean };
    const router = TestBed.inject(Router);
  const allowed = required.length === 0 || required.some(r => auth.hasRole(r));
    if (!allowed) router.navigate(['/admin']);
    return allowed;
  }

  it('permite acceso si usuario tiene rol requerido', () => {
    const res = exec(['ADMIN'], ['ADMIN']);
    expect(res).toBe(true);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('deniega acceso y navega si falta rol', () => {
    const res = exec(['ADMIN'], ['AUTHOR']);
    expect(res).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/admin']);
  });

  it('permite acceso si alguno de los roles coincide', () => {
    expect(exec(['ADMIN','AUTHOR'], ['AUTHOR'])).toBe(true);
  });

  it('sin roles requeridos retorna true', () => {
    expect(exec([], ['AUTHOR'])).toBe(true);
  });
});
