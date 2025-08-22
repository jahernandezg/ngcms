# Roadmap del Proyecto CMS (Angular 20 SSR + NestJS)

Fecha: 12-08-2025

## Entregado (MVP Read-Only)

- UC001: Listado de posts publicados con paginación (BE/FE).
- UC002: Detalle por slug con incremento de viewCount; página de detalle con relacionados.
- UC003: Filtrado por categorías (incluye descendientes) y página de categoría.
- Tags y relacionados: endpoints y UI; ranking por tags/categorías compartidas.
- UC004: Búsqueda con sugerencias (títulos/tags); debounced; SSR-friendly.
- SEO básico: Title/Meta; JSON-LD (Article) en detalle; sitemap.xml; robots.txt.
- API consistente: interceptor global { success, message, data, meta }.
- Seguridad base: Helmet, CORS, rate-limiting (Throttler).
- Config validada: ConfigModule con validación de entorno.
- Docs: Swagger en /api/docs.
- Healthcheck: /api/health.
- Docker: Dockerfiles multi-stage (FE/BE) y docker-compose con healthchecks.
- Tests mínimos: unit (FE/BE/libs) + e2e backend y e2e frontend smoke.

## Infra de CI

- Workflow GitHub Actions: lint, test+coverage, build, e2e (backend y frontend smoke).
- Cache de npm configurado; variables mínimas para validación de config.

## Roadmap por Waves (actualizado 14-08-2025)

### Wave 0 (Hecho / Inmediato)

- Fix test FE roto (pendiente de ejecutar tras refactor de App).
- Interceptor respuesta global y ValidationPipe (implementado).
- Seed y migrations estables.

### Wave 1 (Completada)

- Modularización backend inicial: separar categorías, tags, users.
- Endpoints dedicados: /authors/:id (o slug) y /authors para listar.
- Author page en frontend (ruta `/author/:id` o slug) con posts del autor.
- Refactor rutas frontend a lazy loading donde aporte (parcial: post-detail, category, tag, search, author).
- Utilidades: cálculo readingTime (si no presente) y slugify centralizado.

### Wave 2 (Testing & Calidad Base) - Casi completada

- Cobertura intermedia: Backend ahora ~91/76/89/91; thresholds elevados a S85/B70/F80/L85 (DONE). Frontend thresholds fijados (S85/B40/F70/L85) – subir más adelante.
- collectCoverageFrom configurado excluyendo main/modules/dto (DONE).
- Contract tests ampliados (posts, slug, related, category, tag, search, sitemap/robots bypass) (DONE).
- E2E journey ligero mock (list -> detail -> related -> category -> tag -> search -> suggest) (DONE).
- Husky + commitlint + lint-staged + .prettierrc (Prettier v3) implementado (DONE). (Pendiente: evaluar ESLint Airbnb extend si aporta sobre configuración actual).

### Wave 3 (SEO & Accesibilidad)

- Canonical + prev/next + breadcrumbs.
- JSON-LD: ItemList, BreadcrumbList, WebSite/SearchAction.
- OG/Twitter dinámico + generación de imágenes (posterior si tiempo).
- Social share buttons componentes.
- Auditoría accesibilidad (axe) + correcciones.

### Wave 4 (Performance Angular & Caching)

- Lazy + Deferrable Views + zoneless (remover Zone.js) tras tests.
- Splitting bundles + budgets estrictos.
- HTTP caching headers + SW (precache critical) + preconnect hints.
- Optimización imágenes (WebP + tamaños responsivos).

### Wave 5 (Búsqueda Avanzada)

- Postgres FTS (tsvector persistido + índice GIN + triggers).
- Ranking ts_rank (pesos: título > excerpt > contenido).
- Sugerencias mejoradas (trigram + tags por frecuencia).
- Facets (count por categoría/tag en resultados).

### Wave 6 (Observabilidad & Seguridad)

- Logging estructurado (pino/winston) + requestId.
- OpenTelemetry traces + metrics + exporter.
- Sentry (frontend/backend).
- Security hardening: CSP, COOP, CORP, dependency & container scan (Trivy/CodeQL).

### Wave 7 (Pulido Final & Objetivos CREST-V)

- Angular Material + design tokens integrados con Tailwind.
- Skeleton loaders + estados vacíos uniformes.
- Cross-browser & mobile audit Lighthouse CI.
- Cobertura final (Backend ≥90%, Frontend ≥85%).
- Performance objetivos (FCP <1.5s / TTI <3s) medidos y documentados.

## Notas

- SSR está en modo server; el e2e de FE usa stubs de /api para evitar intermitencias.
- La API envuelve respuestas en { success, message, data }; ajustar clientes nuevos a este contrato.
- Próximo paso Wave 2: posible ajuste ESLint base + elevar cobertura frontend y luego cerrar Wave 2.
