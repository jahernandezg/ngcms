# Sugerencias de mejoras (roadmap propuesto)

Este documento lista mejoras concretas y priorizadas para el monorepo Nx (Angular 20 + NestJS 11 + Prisma + SSR) con foco en calidad, DX y escalabilidad.

## Aportes implementados recientemente

- E2E Frontend “smoke” con Cypress: intercepta `/api/**` para desacoplar de la BD y validar render básico en Home.
- Workflow de CI (GitHub Actions): lint, tests con cobertura, build y e2e (frontend y backend).
- Interceptor global avanzado: normaliza respuestas y detecta listados paginados para construir `meta` automáticamente.
- Categorías: búsqueda por descendientes vía BFS; Relacionados: ranking por intersección de tags/categorías.
- Documentación operativa añadida en `ROADMAP.md` con entregables y próximos hitos.

## Quick wins (1–2 días)

- Búsqueda (UX)
  - Persistir estado en la URL: soportar `?q=...&page=...` (sincronizar Signals ↔ query params).
  - Resaltado de términos en resultados y sugerencias (simple `<mark>` sobre coincidencias).
  - Navegación con teclado en autocompletado (↑/↓/Enter/Escape) y accesibilidad (roles/aria-*).
- Frontend
  - Lazy load de rutas secundarias (`post/:slug`, `category/:slug`, `tag/:slug`, `search`).
  - Limpieza del `nx-welcome.ts` o mover estilos para eliminar el aviso de presupuesto de estilos.
  - MetaService: setear Title/Meta en Post Detail y páginas de categoría/etiqueta.
- Backend
  - Swagger/OpenAPI en `/api/docs` (decorators + `@nestjs/swagger` ya está instalado).
  - Health checks: `/health` (terminus) + liveness/readiness en Docker Compose.
  - CORS/Helmet configurado explícitamente; rate-limit básico por IP (Nest rate-limiter).
- DevEx/Nx
  - Arreglar lint del backend: eliminar flag inválido `--no-interactive` del comando eslint.
  - Librería `shared-interfaces`: tipos compartidos (DTOs) para evitar `any` en HttpClient del FE.
- Prisma/Datos
  - Índices: confirmar índices en `Post.slug`, `Tag.slug`, `Category.slug`, `Post.publishedAt`, compuestos (status,publishedAt), `PostTag(tagId,postId)` y `PostCategory`.
  - Semillas reproducibles: usar `faker` y feature flags para desactivar en prod.

## Mejora de búsqueda (1 sprint)

- Postgres Full-Text Search (FTS):
  - `tsvector` generado (title + content + excerpt) con índice GIN.
  - `websearch_to_tsquery(q)` para relevancia, ordenando por `ts_rank_cd`.
  - Fallback a trigram (`pg_trgm`) para tolerar typos (`%` similarity).
- Sugerencias más ricas:
  - Autocomplete por prefijo (ftw) en títulos y tags; popular queries.
  - “Did you mean…?” con trigram en términos frecuentes.
- API de búsqueda:
  - Facetas (categoría, tag, fecha) y filtros combinables.
  - Campos de “highlight” precomputados para FE.

## Frontend (Angular 20, SSR)

- Signals Store ligera (o NGXS/NgRx si es necesario) para estados compartidos.
- Deferrable Views y Control Flow nuevo para skeletons y carga progresiva.
- Imagen optimizada (ngOptimizedImage) y prefetch selectivo de rutas.
- PWA opcional (service worker para caching de estáticos y modo offline de lectura).
- Accesibilidad: navegación por teclado completa, contraste de colores, `aria-live` para resultados.

## Backend (NestJS)

- Respuesta uniforme global: interceptor que normalice `{ success, message, data, meta }`.
- Filtros globales de errores (HttpExceptionFilter) con mapeo consistente.
- Logging estructurado (pino) con correlation-id (middleware) y nivel por entorno.
- Configuración validada (Zod o `class-validator`) para variables de entorno.
- Rate limiting por ruta sensible, y protección básica a `/api/search`.

## Prisma y performance

- Evitar N+1: revisar `include/select` en endpoints de listado y detalle.
- Paginación estable: `orderBy publishedAt, id` para garantizar cursor estable.
- Caching de consultas calientes: Redis opcional (e.g., lista home, related posts, sugerencias).
- Migraciones seguras: `prisma migrate deploy` en arranque + backups antes de cambios.

## Caché público por escritura (plan futuro)

Objetivo: minimizar lecturas a BD en la parte pública (blog) cacheando en el momento de escribir/actualizar y sirviendo desde cache para anónimos. Aplica a: páginas, posts, taxonomías (categorías/tags), menú y theme activo.

- Store recomendado: Redis gestionado (Upstash/Fly Valkey). Para MVP se puede iniciar con LRU en memoria (solo 1 réplica) y migrar a Redis sin cambiar consumidores.
- Patrón: read‑through + invalidación selectiva en escritura.
  - Lecturas: intentar cache → si falta, leer BD, serializar DTO y `set` en cache.
  - Escrituras (create/update/publish/unpublish/delete): confirmar BD → invalidar claves/grupos afectados → opcional “precalentar” vistas comunes.
- TTL: opcional. Con invalidación correcta, TTL largo o sin TTL; para listados, TTL corto (1–5 min) es aceptable si no se quiere precalentado.

Claves sugeridas (prefijo `cms:`):

- `post:slug:{slug}` y `page:slug:{slug}`
- Listas: `list:home:{qhash}`, `list:category:{slug}:{page}`, `list:tag:{slug}:{page}`
- Taxonomías: `cat:{slug}`, `tag:{slug}`, `cats:all`, `tags:all`
- Menú: `menu:main`
- Theme activo: `theme:active`

Grupos de invalidación (sets que contienen las claves a borrar):

- `group:post:{id}`
- `group:category:{slug}` y `group:tag:{slug}`
- `group:menu`
- `group:theme`

Triggers de invalidación (ejemplos):

- Post (crear/editar/publicar/despublicar/eliminar): borrar `group:post:{id}`; borrar listas relacionadas `list:home:*`, `list:category:{catSlug}:*`, `list:tag:{tagSlug}:*`. Precalentar detalle (`post:slug:{slug}`) y primera página de listas si procede.
- Categoría/Tag actualizados: borrar `group:category:{slug}` o `group:tag:{slug}` y sus listas.
- Menú actualizado: borrar `menu:main`.
- Theme activado: borrar `theme:active` (y asegurar propagación de CSS tokens en FE público).

Headers HTTP recomendados (mejoran CDN):

- SSR HTML para usuarios anónimos: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.
- API públicas GET: habilitar `ETag` y `Cache-Control: public, s-maxage=60-120`.
- Admin/autenticadas: `Cache-Control: no-store`.

Implementación propuesta (Nest):

- Módulo de cache con `cache-manager` y store Redis (`cache-manager-redis-yet`), configurable por env `REDIS_URL`; fallback a LRU en memoria para desarrollo/single replica.
- `CacheService` con helpers: `getJSON<T>(k)`, `setJSON(k,v,ttl?)`, `del(k)`, `addToGroup(group,k)`, `invalidateGroup(group)`, `delPattern(pat)`.
- Integración en servicios de dominio (Posts/Pages/Taxonomy/Menu/Theme): read‑through en `get*`, invalidación y precalentado en `create/update/delete/publish`.
- Opcional: eventos (`EventEmitter2`) `PostUpdated`, `MenuUpdated`, `ThemeActivated` para centralizar invalidación/precalentado.

SSR (Angular) y estáticos:

- Mantener estáticos con caché fuerte (hash en nombres) — ya está en SSR actual.
- Añadir micro‑cache en SSR HTML (30–60s por URL) activable por env (`SSR_MICROCACHE=1`).

Definición de Hecho (DoD):

- Toggleable por entorno (`REDIS_URL` ausente → fallback memoria; presencia → Redis) sin cambios en consumidores.
- Pruebas: lecturas desde cache tras primer hit; invalidación consistente post‑update; headers adecuados en rutas públicas.
- Observabilidad: métrica de aciertos/fallos de cache y latencia percibida; logs de invalidación.

## Seguridad

- Helmet, CORS ajustado a dominios esperados, y saneamiento de inputs.
- CSRF si se agregan endpoints de mutación desde navegador.
- Auditoría de dependencias (npm audit/OSS Review) y política de actualización.

## Observabilidad y calidad

- Telemetría: OpenTelemetry (traces/metrics/logs) + Prometheus/Grafana.
- Sentry para errores FE/BE.
- Tests
  - Unit: servicios Nest y componentes Angular clave.
  - E2E: flujos principales (home → detalle → categoría/tag → búsqueda) con Cypress.
  - Contract tests FE↔BE a partir de OpenAPI (o zodios/ts-rest).
- Thresholds de cobertura y ejecución en CI.

## SEO

- Metadatos dinámicos (OG/Twitter), JSON-LD para artículos, breadcrumbs.
- `sitemap.xml` y `robots.txt` generados desde el backend.
- Canonical URLs y `hreflang` si se agrega multi-idioma.

## DevEx, Nx y CI/CD

- Reglas de módulos Nx (tags) para boundaries (domain/data/ui).
- Cache remoto de Nx (S3/GCS) y pipelines por `affected`.
- Husky + lint-staged + commitlint; formateo obligatorio (Prettier).
- GitHub Actions: matrices (node versions), jobs separados FE/BE, artefactos de build.

## Infra y despliegue

- Docker: añadir Dockerfile para backend (multi-stage) y healthchecks en compose.
- Variables en runtime (no bake en imagen) y `NODE_ENV=production`.
- Escalado: PM2/cluster o contenedor por instancia; readiness para balanceador.
- DB: pgbouncer si aumenta concurrencia; backups y rotación.

## Roadmap sugerido (orden)

1) Quick wins + SEO básico de detalle y categorías/tags.
2) FTS en Postgres con índices y facets; mejoras UX de búsqueda.
3) Observabilidad (Sentry + métricas) y caché en endpoints calientes.
4) CI/CD con Nx affected + cache remoto + quality gates.
5) Endurecer seguridad (Helmet, rate-limit, config valida) y logging estructurado.
6) Refinar DX (libs compartidas, boundaries Nx, clean arch) y performance FE (lazy, defer, imágenes).
