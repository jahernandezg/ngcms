# Changelog

## 1.3.0 - Branding e Identidad

- BlogConfig (NestJS + Prisma): GET/PUT con validación y caché en memoria (TTL 1h).
- Admin Branding UI (Angular): identidad básica, assets (logo claro/oscuro, favicon, OG, post por defecto), SEO y técnica.
- Uploads: validación de formatos/tamaños, compresión automática >1MB, favicon PNG permitido solo 16/32/48 o ICO; eliminación segura.
- SSR/SEO: inyección GA4 en SSR (ANALYTICS_ID) y en cliente vía configuración; meta/OG dinámicos.
- Placeholders por defecto y mejoras de UX.
- Tests: validación de favicon PNG (sizes), ajustes de Auth refresh.

