import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

// Uso: canActivate: [roleGuard], data: { roles: ['ADMIN'] }
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  const required: string[] = route.data?.['roles'] || [];
  if (!required.length) return true;
  const allowed = required.some(r => auth.hasRole(r));
  if (allowed) return true;
  return router.createUrlTree(['/admin']);
};
