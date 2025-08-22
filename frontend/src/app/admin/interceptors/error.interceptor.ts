import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastService } from '../components/toast-container.component';
import { AdminAuthService } from '../services/admin-auth.service';
import { catchError, throwError } from 'rxjs';

// Interceptor de errores genérico: muestra toast y maneja 401/403/422/500.
export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const toasts = inject(ToastService);
  const auth = inject(AdminAuthService);
  return next(req).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse) {
        const status = err.status;
        let msg = 'Error';
        if (status === 0) msg = 'Red no disponible';
        else if (status === 400) msg = (err.error?.message) || 'Solicitud inválida';
        else if (status === 401) msg = 'No autorizado';
        else if (status === 403) msg = 'Acceso denegado';
        else if (status === 404) msg = 'No encontrado';
        else if (status === 422) msg = 'Datos inválidos';
        else if (status >= 500) msg = 'Error servidor';
        toasts.error(msg);
        if (status === 401) {
          if (!auth.getAccessToken()) auth.logout();
        }
      }
      return throwError(() => err);
    })
  );
};
