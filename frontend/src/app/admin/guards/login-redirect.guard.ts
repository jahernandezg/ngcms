import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

// Redirige del login al dashboard si ya hay sesión
export const loginRedirectGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return router.createUrlTree(['/admin','dashboard']);
  return true;
};
