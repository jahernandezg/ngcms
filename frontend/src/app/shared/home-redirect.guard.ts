import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface Envelope<T> { success: boolean; data: T; }
interface PageLite { id: string; slug: string; title: string; content: string; }

// Guard que decide si redirigir a la página marcada como homepage.
// Si no existe homepage publicada, permite seguir (mostrando HomeComponent como blog).
export const homeRedirectGuard: CanActivateFn = () => {
  const http = inject(HttpClient);
  const router = inject(Router);
  return http.get<Envelope<PageLite | null>>('/api/pages/homepage').pipe(
    map(res => res && res.data ? router.createUrlTree(['/pages', res.data.slug]) : true),
    catchError(() => of(true))
  );
};
