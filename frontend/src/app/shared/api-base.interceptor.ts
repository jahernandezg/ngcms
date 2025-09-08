import { HttpInterceptorFn } from '@angular/common/http';

// Exportable para reutilizar en helpers de assets
export function getApiBase(): string {
  // Modo navegador: permite configurar sin rebuild vía window.__env o meta
  if (typeof window !== 'undefined') {
    const anyWin = window as unknown as { __env?: Record<string, string> };
    const fromWindow = anyWin.__env?.['API_BASE'] || anyWin.__env?.['API_URL'];
    if (fromWindow) {
      const trimmed = fromWindow.replace(/\/$/, '');
      return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
    }
  }
  // Meta tag opcional
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="api-base"]') as HTMLMetaElement | null;
    if (meta?.content) return meta.content.replace(/\/$/, '');
  }
  // Fallback a variable de entorno de ejecución (SSR) si se inyecta
  if (typeof process !== 'undefined') {
    const apiBase = process.env?.['API_BASE'] as unknown as string | undefined;
    if (apiBase) return apiBase.replace(/\/$/, '');
    // Soporta API_URL (típico: https://api.dom.com/api) -> derivar base sin "/api"
    const apiUrl = process.env?.['API_URL'] as unknown as string | undefined;
    if (apiUrl) {
      const trimmed = apiUrl.replace(/\/$/, '');
      return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed; // quita "/api" si está al final
    }
  }
  // Fallback final: vacío -> mantiene URLs relativas (requiere proxy de /api y /uploads)
  return '';
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
