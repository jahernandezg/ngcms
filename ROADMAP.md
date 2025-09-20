# ROADMAP DEL PROYECTO (Estado implementado)

Fecha: 2025-09-20

Este documento resume, en español, todo lo que está implementado hasta el momento en el CMS (Angular 20 SSR + NestJS + Prisma, Nx Monorepo), agrupado por releases. La implementación actual es aditiva, preserva compatibilidad y sigue convenciones de código y calidad establecidas.

## Resumen Ejecutivo
- Frontend público con SSR: listado, detalle, filtros, búsqueda y paginación funcionando.
- Panel de administración con autenticación JWT, roles y CRUD de posts operativo.
- Sistema de Páginas estáticas, Menú dinámico y base de tematización (Medium‑style) integrados.
- Configuración centralizada de identidad/branding (nombre, logos, favicon, meta/SEO) activa.
- Imagen principal de post (featured) con validación 16:9, preview/crop, compresión y thumbnails.
- Respuesta API consistente { success, message, data, meta }, logging con correlation id, y manejo global de errores.

---

## Entregas por Release (implementado)

### Release 1.1 – Arquitectura Base (MVP lectura pública)
- Listado de posts publicados con paginación (page, limit; default 10, máx 50).
- Detalle de post por slug único y endpoint de relacionados básico.
- Filtros por categoría y tag (por slug) y por autor (id actual; migración a slug planificada).
- Búsqueda básica (q) en título + excerpt (case‑insensitive LIKE).
- Cálculo de readingTime en backend: ceil(words/250).
- Slugs únicos autogenerados.
- SSR con title, meta description (excerpt truncado) y canonical básico.
- Seed inicial (≥1 autor, ≥3 posts, categorías, tags).
- Contrato de respuesta: { success, message, data, meta } con meta { total, page, limit, totalPages }.

### Release 1.2 – Admin Panel (Gestión de contenido)
- Autenticación JWT: access 15m (HS256) + refresh 7d; endpoint de refresh.
- Roles: ADMIN y AUTHOR; ownership aplicado (AUTHOR edita solo sus posts).
- Seguridad: rate‑limit login (5 req/min), lockout tras 5 intentos (15 min), Helmet habilitado.
- CRUD de posts en /api/admin/... (crear, listar paginado, editar, borrar simple; estados DRAFT|PUBLISHED).
- Sanitización básica de HTML en servidor (whitelist).
- Dashboard con totales (posts, publicados, usuarios) y últimos 5 posts.
- Auditoría mínima de LOGIN y CRUD de posts.

### Release 1.3 – Medium Style: Páginas, Menú y base de Temas
- Pages (entidad separada de posts): CRUD completo con SEO por página, featuredImage y sortOrder.
- Homepage única seleccionable por admin (regla de negocio garantizada y endpoint de consulta).
- URLs amigables: /about, /contact, /blog, /category/:slug; posts bajo /post/:slug.
- Menú dinámico administrable con tipos: PAGE, POST, BLOG_INDEX, CATEGORY, EXTERNAL_LINK.
- ThemeSettings + ThemeService (base de tematización por variables CSS, modular SCSS/Tailwind). Tema "Medium" aplicado: single column (~680px), tipografía y espaciado acordes.
- SEO extendido para páginas: meta tags, Open Graph y JSON‑LD WebPage; sitemap y canonical.

### Release 1.4 – Identidad y Branding del Blog
- Configuración centralizada (BlogConfig):
  - Identidad: blogName, description/tagline, siteUrl.
  - Visual: logoLight, logoDark, favicon, defaultPostImage, ogImage por defecto.
  - SEO: metaDescription, keywords, analyticsId (GA4), searchConsoleCode.
  - Sociales: Twitter/X, LinkedIn, GitHub, Instagram.
  - Técnicos: locale, timezone, postsPerPage, enableComments.
- Endpoints: GET/PUT /api/blog-config.
- Uploads de assets: POST /api/uploads/logo-light|logo-dark|favicon|og-image y DELETE /api/uploads/:type/:filename.
- Validación de formatos/tamaños y compresión automática con Sharp; cache en memoria (TTL 1h) e invalidación en cambios.
- Integración con SSR (metatags) y ThemeService (logos por tema claro/oscuro).

### Release 1.4 (extensión) – Imagen principal de Posts
- Upload opcional de featured image por post con drag&drop o selección.
- Validación estricta de aspecto 16:9 (±2%); crop/ajuste básico disponible.
- Formatos permitidos: JPEG/PNG/WebP; tamaño máx 5MB; compresión >2MB a calidad 85.
- Resize a máx 1920×1080; nombres únicos (timestamp + hash).
- Thumbnails generados: 150×84 (admin) y 400×225 (cards públicas).
- Reemplazo con limpieza de fichero previo; prevención de huérfanos.
- Integración: campo Post.featuredImage (DTOs extendidos); uso como og:image; fallback a defaultPostImage.

---

## Esquema de Datos (Prisma) vigente
- User: id, name, slug?; extensiones para admin: failedAttempts, lockedUntil, adminLastLogin.
- Post: id, title, slug @unique, excerpt?, content, status (DRAFT|PUBLISHED), readingTime, publishedAt, authorId, featuredImage?, relaciones PostCategory[] y PostTag[].
- Category: id, name, slug @unique, PostCategory[].
- Tag: id, name, slug @unique, PostTag[].
- Join tables: PostCategory, PostTag.
- Page: id, title, slug @unique, content, excerpt, status (DRAFT|PUBLISHED|ARCHIVED), isHomepage, seoTitle, seoDescription, seoKeywords, featuredImage?, authorId, sortOrder, templateId?, createdAt, updatedAt.
- MenuItem: id, title, url, type (PAGE|POST|BLOG_INDEX|CATEGORY|EXTERNAL_LINK), targetId?, parentId?, sortOrder, isVisible, openNewWindow, timestamps.
- ThemeSettings: id, name, isActive, primaryColor, secondaryColor, templatePath, customCss, settings (JSONB), timestamps.
- BlogConfig: identidad/branding/SEO/social/tech con timestamps, cacheable.
- AuditLog: id, userId, action, resource, resourceId, createdAt.

---

## Endpoints principales activos
- Públicos:
  - GET /posts?page&limit
  - GET /posts/:slug
  - GET /posts/:slug/related
  - GET /category/:slug?page&limit
  - GET /tag/:slug?page&limit
  - GET /author/:id?page&limit (migración futura a /author/:slug)
  - GET /search?q&page&limit
  - GET /search/suggest?q
  - GET /api/pages/homepage
  - (SEO) sitemap.xml, robots.txt
- Admin (/api/admin/...):
  - Auth: login, refresh
  - Posts: CRUD, publicar, listar paginado
  - Dashboard: métricas básicas y últimos posts
  - Menú: CRUD y ordenación (drag&drop)
  - Páginas: CRUD y set homepage
  - Temas: listar/activar/actualizar ajustes
- Configuración/Uploads:
  - GET/PUT /api/blog-config
  - POST /api/uploads/logo-light|logo-dark|favicon|og-image
  - DELETE /api/uploads/:type/:filename
  - POST /api/uploads/post-image (featured post) | GET /api/uploads/post-image/:filename | DELETE /api/uploads/post-image/:id

---

## Calidad, Rendimiento y Operativa
- Código: TypeScript strict, ESLint + Prettier, Conventional Commits.
- SSR: TTFB dev objetivo <1500ms; bundle inicial <800KB (optimizable en siguientes iteraciones).
- Seguridad: Helmet, CORS; rate‑limit login y lockout.
- Logging: winston/pino con requestId (correlation id) y filtros globales de errores.
- Pruebas: Jest (unit) + Cypress (E2E); cobertura mínima vigente ≥60% (objetivos superiores definidos para fases siguientes).
- Docker Compose: PostgreSQL, backend y frontend SSR con healthchecks y scripts de seed/migrate.

---

## Notas de compatibilidad
- Todas las funcionalidades nuevas son aditivas y preservan rutas públicas existentes.
- Migraciones de DB sin cambios destructivos; rollback planificado por orden inverso.
- Frontend y Admin con estilos modulados (separación de dominios de estilo) y base de temas activa.

---

## Próximos pasos sugeridos (no implementado aún, guía de trabajo)
- Migrar /author/:id → /author/:slug en público.
- Mejoras SEO (JSON‑LD adicionales, breadcrumbs, prev/next) y accesibilidad (auditoría axe).
- Optimización de rendimiento (Deferrable Views, splitting, imágenes responsivas, hints de conexión).
- Búsqueda avanzada (FTS Postgres, ranking ts_rank, trigram suggestions, facets).
- Observabilidad (OpenTelemetry, Sentry) y hardening (CSP/COOP/CORP, análisis de dependencias/containers).
