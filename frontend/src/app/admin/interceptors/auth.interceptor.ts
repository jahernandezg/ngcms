import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminAuthService } from '../services/admin-auth.service';
import { catchError, concatMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AdminAuthService);
  const access = auth.getAccessToken();
  const cloned = access ? req.clone({ setHeaders: { Authorization: `Bearer ${access}` } }) : req;
  return next(cloned).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const refresh$ = auth.refresh();
        if (!refresh$) return throwError(() => err);
        return refresh$.pipe(
          concatMap(r => {
            if (!r || !r.success) return throwError(() => err);
            const newAccess = auth.getAccessToken();
            if (!newAccess) return throwError(() => err);
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newAccess}` } });
            return next(retried);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
