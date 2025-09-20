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

## Roadmap futuro (planificado – será construido)

Nota: Todas las líneas a continuación están planificadas y se desarrollarán en las próximas releases. Las fechas y el orden pueden ajustarse según prioridades y dependencias, pero el alcance funcional y los criterios de aceptación quedan definidos.

### FASE 1 – FOUNDATION (pendiente)
- Release 1.4 – Media Management (Gestión de archivos)
  - Upload avanzado (drag & drop, reanudable por chunks hasta 5GB, progreso, reintentos).
  - Validación (MIME/extensión, límites por tamaño/cuota, antivirus ClamAV, duplicados SHA‑256).
  - Proveedores de storage: Local, AWS S3, Cloudinary, GCP, Azure; URLs firmadas privadas y CDN.
  - Procesado de imágenes (variantes, WebP/AVIF, compresión, smart crop), vídeo/audio (transcoding, thumbnails, capítulos, subtítulos).
  - Media library (carpetas, tags, metadatos, búsqueda avanzada, bulk ops), picker integrado al editor.
  - Analytics de uso y costes; accesibilidad WCAG AA; tests unitarios/integración/E2E con coberturas altas.
- Release 1.5 – Basic SEO (Meta tags y optimización)
  - Motor técnico de SEO: meta dinámicos, canonical/redirecciones, schema markup básico.
  - Optimizador de contenido en tiempo real (legibilidad, keywords, linking interno) y seguimiento básico de rankings.
  - Integraciones GA4/Search Console/GTM; dashboards de SEO esenciales; reporting básico.
- Release 1.6 – Performance (Optimización inicial)
  - Caching multinivel (memoria/Redis/CDN) e invalidación; compresión y optimización de respuestas API.
  - Code splitting y budgets; Deferrable Views y deferred loading; imágenes responsivas/lazy; PWA inicial (SW, offline básico).
  - Monitorización de Core Web Vitals y APM; objetivos: LCP<2.5s, CLS<0.1, TBT<200ms.

- Release 1.7 – Hardening de Arquitectura, Auth y Admin (derivado de R1.1–R1.3; será construido)
  - Angular 20 y Nx:
    - Migración a nuevo control flow (@if/@for, @switch) en vistas clave.
    - Signals para estado local y comunicación entre componentes; zoneless-ready donde aplique.
    - Deferrable Views y deferred loading en rutas/bloques no críticos; Image Directive; ajustes de hydration SSR.
  - Admin UX (Angular Material + Tailwind):
    - Homologar UI de Admin con Angular Material (tabla, paginator, sort, dialogs, snackbar).
    - Form builder reactivo con validaciones avanzadas y estados; autosave de borradores; previsualización rica.
    - Editor de contenido mejorado: embeds (YouTube/Twitter), markdown/HTML con sanitización, atajos de teclado e historial de cambios.
  - Contenido:
    - Programación de publicación (scheduledAt) y despublicación; estados extendidos DRAFT|PUBLISHED|ARCHIVED.
    - Versionado/revisiones de posts y pages con diff y restore.
  - Taxonomías:
    - CRUD de Categorías y Tags en Admin; merge/split de tags; ordenación y slugs con transliteración.
  - Usuarios y roles:
    - CRUD de usuarios, asignación de roles, perfil y avatar; migración de /author/:id a /author/:slug.
  - Autenticación y seguridad:
    - Rotación de refresh tokens y lista de revocación; cierre de sesión por dispositivo/sesión.
    - 2FA TOTP opcional; políticas de contraseña; CAPTCHA adaptativo tras intentos fallidos.
    - Rate limiting por endpoint/usuario/IP; allow/deny list para Admin; headers hardening; CSRF si se usan cookies.
    - Auditoría ampliada (acciones clave en Admin); GDPR: export y borrado de datos.
  - API y documentación:
    - Versionado v1 estable; OpenAPI completa y ejemplos; contratos estrictos de errores.
  - Operativa:
    - Docker Compose con perfiles dev/prod, healthchecks y scripts idempotentes; semillas reproducibles.
  - Pruebas:
    - Aumentar cobertura a ≥70% en Fase 1 con suites para auth, roles, pages, menú, uploads y scheduling; E2E de flujos críticos de Admin.

### FASE 2 – LEARNING PLATFORM
- Release 2.1 – Course Structure (Sistema de cursos)
  - Dominio Curso>Módulo>Lección, catálogo, course builder, UX de aprendizaje, dashboards instructor/estudiante.
- Release 2.2 – Module System (Módulos y lecciones)
  - Lecciones interactivas (video/texto/quiz/H5P), aprendizaje adaptativo, gamificación inicial.
- Release 2.3 – Video Integration (Player y hosting)
  - Streaming ABR (HLS), transcripción y capítulos automáticos, player interactivo, live con baja latencia.
- Release 2.4 – Progress Tracking (Seguimiento)
  - Tracking granular en tiempo real, analytics predictivo, intervenciones y gamificación avanzada.
- Release 2.5 – Assessments (Quizzes y evaluaciones)
  - >15 tipos de pregunta, auto‑grading (IA en abiertas), proctoring/anti‑cheating, banco de preguntas.
- Release 2.6 – Certificates (Certificación)
  - Certificados y badges (Open Badges), verificación (incl. blockchain), portal de verificación y analytics.

### FASE 3 – MONETIZATION
- Release 3.1 – Payment System
  - Integración multi‑proveedor (Stripe/PayPal/crypto), pagos únicos y suscripciones, facturación e invoicing.
- Release 3.2 – Membership Tiers (Membresías)
  - Tiers con beneficios, rewards/puntos, engagement/retención, personalización por nivel.
- Release 3.3 – Content Gating (Paywall)
  - Reglas de acceso, previews optimizados, A/B testing, personalización y funnels de conversión.
- Release 3.4 – Subscription Management
  - Ciclo de vida, churn prediction (ML), dunning, revenue optimization y campañas de retención.
- Release 3.5 – Analytics Pro
  - Event tracking avanzado, tiempo real, modelos predictivos (LTV/churn/forecast), reporting BI.
- Release 3.6 – Email Marketing
  - Campañas y automatizaciones, segmentación avanzada, personalización dinámica, deliverability.

### FASE 4 – EXTENSIBILITY
- Release 4.1 – Plugin Foundation
  - Core de plugins con SDK, runtime seguro (sandbox), carga dinámica y analítica de uso.
- Release 4.2 – Theme System
  - Motor de temas con editor visual (tokens, responsive), marketplace de temas y accesibilidad WCAG AA.
- Release 4.3 – Plugin Marketplace + Widget System
  - Marketplace de plugins (descubrimiento/licencias) y sistema de widgets con builder drag‑and‑drop, comunicación entre widgets y sandbox.
- Release 4.4 – API Management
  - Suite REST/GraphQL/Webhooks, OAuth2/API keys, rate limiting/quotas, portal para desarrolladores.
- Release 4.5 – Advanced SEO
  - Motor SEO avanzado (automatización técnica/contenido), keyword intelligence, rank tracking y reporting.
- Release 4.6 – Performance Pro
  - Plataforma de optimización pro (caching/CDN/imagenes/código), RUM y tuning automatizado con objetivos >90 en CWV.

### Metas transversales (todas las releases planificadas)
- Calidad: backend >90% y frontend >85% de cobertura; E2E de flujos críticos.
- Rendimiento: tiempos de carga <2s en vistas clave; APIs p95 <200ms.
- Seguridad/privacidad: RBAC, auditoría, cumplimiento (GDPR/PCI según módulo), escaneos y hardening.
- Observabilidad: métricas/alertas en tiempo real, dashboards por dominio y SLAs documentados.
