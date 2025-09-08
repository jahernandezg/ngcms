import { HttpInterceptorFn } from '@angular/common/http';

function getApiBase(): string {
  // Prefer meta tag on client
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="api-base"]') as HTMLMetaElement | null;
    if (meta?.content) return meta.content.replace(/\/$/, '');
  }
  // Fallback to env at build/SSR time
  const fromEnv = (typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>)?.['API_BASE'] : undefined);
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  // Default backend domain
  return 'https://api.tsinit.com';
}

export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url || '';
  // Only rewrite relative calls to /api or /uploads
  if (/^\/(api|uploads)\b/.test(url)) {
    const withBase = `${getApiBase()}${url}`;
    return next(req.clone({ url: withBase }));
  }
  return next(req);
};
