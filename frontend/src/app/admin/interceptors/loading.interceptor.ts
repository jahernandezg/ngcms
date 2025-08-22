import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const loading = inject(LoadingService);
  const track = !req.headers.has('X-No-Loading');
  if (track) loading.start();
  return next(req).pipe(finalize(() => { if (track) loading.stop(); }));
};
