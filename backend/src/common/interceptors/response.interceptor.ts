import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { url: string }>();
    // Omitir para sitemap/robots u otras respuestas no JSON string
    const bypass = req?.url?.includes('sitemap.xml') || req?.url?.includes('robots.txt');

    return next.handle().pipe(
      map((data: unknown) => {
        if (bypass) return data; // mantener como está
        if (data && typeof data === 'object' && 'success' in (data as Record<string, unknown>)) return data; // ya formateado

        // Normalización de listados paginados: { items, total, page, limit }
        if (this.isPagedResult(data)) {
          const { items, total, page, limit, ...rest } = data;
          const totalPages = Math.ceil((total || 0) / (limit || 1));
          return {
            success: true,
            message: 'OK',
            data: items,
            meta: { total, page, limit, totalPages, ...rest },
          } as const;
        }

        return { success: true, message: 'OK', data } as const;
      })
    );
  }

  private isPagedResult(
    data: unknown
  ): data is { items: unknown[]; total: number; page: number; limit: number; [k: string]: unknown } {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      Array.isArray(d.items) &&
      typeof d.total === 'number' &&
      typeof d.page === 'number' &&
      typeof d.limit === 'number'
    );
  }
}
