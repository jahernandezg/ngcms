import { getApiBase } from './api-base.interceptor';

// Convierte rutas relativas de uploads (/uploads/...) a absolutas con el host del backend
export function buildAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // absoluto ya
  if (/^https?:\/\//i.test(url)) return url;
  // prefija sólo uploads
  if (url.startsWith('/uploads/')) return `${getApiBase()}${url}`;
  return url;
}
