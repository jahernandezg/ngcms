import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { unwrapData } from './http-utils';
import { of } from 'rxjs';

interface PageLite { id: string; slug: string; title: string; content: string; }

// Guard que decide si redirigir a la página marcada como homepage.
// Si no existe homepage publicada, permite seguir (mostrando HomeComponent como blog).
export const homeRedirectGuard: CanActivateFn = () => {
  const http = inject(HttpClient);
  const router = inject(Router);
  return http.get<unknown>('/api/pages/homepage').pipe(
    map(res => {
      const data = unwrapData<PageLite | null>(res as unknown as { data: PageLite | null } | PageLite | null);
      return data ? router.createUrlTree(['/pages', data.slug]) : true;
    }),
    catchError(() => of(true))
  );
};
