import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';

function getApiBase(): string | null {
  // Prefer meta tag so puede cambiar sin rebuild si fuese necesario
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="api-base"]') as HTMLMetaElement | null;
    if (meta?.content) return meta.content.replace(/\/$/, '');
  }
  // Fallback a variable de entorno de ejecución (SSR) si se inyecta
  const fromEnv = typeof process !== 'undefined' ? (process.env?.['API_BASE'] as unknown as string | undefined) : undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  // Fallback final: dominio de API por defecto
  return 'https://api.tsinit.com';
}

export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  // Sólo prefijar llamadas relativas a nuestra API o uploads
  const url = req.url;
  if (/^\/(api|uploads)\b/.test(url)) {
    const base = getApiBase();
    const withBase = `${base}${url}`;
    const cloned = req.clone({ url: withBase });
    return next(cloned);
  }
  return next(req);
};
