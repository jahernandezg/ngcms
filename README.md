# CMS Blog Monorepo (Nx)

Monorepo (Nx) que contiene un backend NestJS + Prisma y un frontend Angular 20 (standalone + signals + SSR) para un blog básico con búsqueda, paginación, SEO y endpoints públicos.

## Branding e Identidad (Release 1.3)

### Endpoints API

- GET /api/blog-config
- PUT /api/blog-config (ADMIN)
- POST /api/admin/uploads/:type (ADMIN) — types: logo-light, logo-dark, favicon, og-image, post-image
- DELETE /api/admin/uploads/:type/:filename (ADMIN)

### Límites y formatos

- Logos: PNG/JPEG/SVG, ≤ 2MB
- Favicon: ICO o PNG 16/32/48, ≤ 1MB
- OG y Post image: PNG/JPEG/WEBP, ≤ 3MB
- Compresión: automática >1MB (sharp)

### SEO y GA4

- GA4 en SSR: define ANALYTICS_ID en el proceso SSR (Angular server) para inyectar script en HTML renderizado.
- GA4 en cliente: si `analyticsId` está en `/api/blog-config`, el cliente lo inyecta dinámicamente.

### Notas

- Configuración cacheada en memoria 1h; se invalida al hacer PUT.
- Archivos servidos estáticamente desde `/uploads`.

## Estado CI

Añade badge tras primer push:

`![CI](https://github.com/<usuario>/<repo>/actions/workflows/ci.yml/badge.svg)`

## Uso rápido (clonar desde GitHub)

```bash
git clone https://github.com/<usuario>/<repo>.git
cd <repo>
npm ci
cp .env.example .env
npm run bootstrap
npm run start:backend &
npm run start:frontend
```

## Preparación Repo

- `.gitignore` consolidado
- `.env.example` sin secretos
- `LICENSE` MIT
- `CONTRIBUTING.md`
- Workflow CI (`.github/workflows/ci.yml`)

## Roadmap Release 3 (CREST-V Pages / Menu / Themes)

Esta sección documenta la Metodología CREST-V aplicada a la ampliación (Release 3) añadiendo Páginas estáticas, Menú dinámico, sistema base de Temas (Medium-style) y preparación de plantilla.

### C - Contexto

Extensión incremental sobre Release 2 (Posts + Admin). Se añaden entidades: Page, MenuItem, ThemeSettings. No se modifican tablas existentes → backward compatible.

### R - Requerimientos Clave

- Pages CRUD (admin) con status (DRAFT/PUBLISHED/ARCHIVED) y campos SEO.
- Homepage dinámica (solo una Page `isHomepage=true`).
- Menú dinámico jerárquico (foundation) con distintos tipos (PAGE, POST, BLOG_INDEX, CATEGORY, EXTERNAL_LINK) y orden drag & drop.
- Theme foundation (ThemeSettings activo + variables CSS) estilo Medium (#f9d923 primario, #000 negro).
- Slug único global lógico entre Posts y Pages (validación aplicación). Pages permiten cambiar slug (re‑verificación siempre).
- SEO extendido: sitemap + JSON-LD + OpenGraph para páginas.

### E - Estructura / Modelo

Prisma (añadir):

```prisma
model Page {
    id             String      @id @default(cuid())
    title          String
    slug           String      @unique
    content        String
    excerpt        String?
    status         PageStatus  @default(DRAFT)
    isHomepage     Boolean     @default(false)
    seoTitle       String?
    seoDescription String?
    seoKeywords    String?
    featuredImage  String?
    author         User        @relation(fields: [authorId], references: [id])
    authorId       String
    sortOrder      Int         @default(0)
    templateId     String?
    createdAt      DateTime    @default(now())
    updatedAt      DateTime    @updatedAt
    @@index([slug])
    @@index([isHomepage])
}

model MenuItem {
    id            String       @id @default(cuid())
    title         String
    url           String?
    type          MenuItemType
    targetId      String?
    parent        MenuItem?    @relation("MenuItemParent", fields: [parentId], references: [id])
    parentId      String?
    children      MenuItem[]   @relation("MenuItemParent")
    sortOrder     Int          @default(0)
    isVisible     Boolean      @default(true)
    openNewWindow Boolean      @default(false)
    createdAt     DateTime     @default(now())
    updatedAt     DateTime     @updatedAt
    @@index([type])
    @@index([parentId])
}

model ThemeSettings {
    id            String   @id @default(cuid())
    name          String
    isActive      Boolean  @default(false)
    primaryColor  String   @default("#f9d923")
    secondaryColor String  @default("#000000")
    templatePath  String?
    customCss     String?
    settings      Json?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt
    @@index([isActive])
}

enum PageStatus { DRAFT PUBLISHED ARCHIVED }
enum MenuItemType { PAGE POST BLOG_INDEX CATEGORY EXTERNAL_LINK }
```

### S - Especificidad (Implementación)

Backend:

- Nuevos módulos: `pages`, `menu`, `themes`, `site-settings`.
- Servicio `SlugService` central que valida unicidad de slug entre `post` y `page` en create/update.
- Endpoint para fijar homepage: `PUT /api/admin/pages/:id/homepage` (desmarca otras dentro de transacción).
- Menú público: `GET /api/menu` (estructura anidada ordenada por `sortOrder`).
- Theme: `GET /api/theme` (retorna activo) y endpoints admin para cambiar activo / actualizar settings.

Frontend:

- Componentes públicos: header/navigation + page-detail + homepage dynamic.
- Servicios: `PagesService`, `MenuService`, `ThemeService`.
- Sistema SCSS modular + variables CSS (Medium theme base) y aislamiento admin vs público.
- Ruta catch-all para pages (tras rutas específicas) con verificación de slug existente; sin lista de slugs reservados (decisión explícita).

Slug Unicidad Global:

- Estrategia: validación lógica (consulta ambos modelos). No se crea tabla unificada (KISS, mantiene migración simple). Riesgo de race condition mitigable con transacción + re‑check.

### T - Trazabilidad / Fases

1. Migración Prisma (schema + migración SQL raw para homepage única - opcional; preferimos lógica transaccional → no se añade trigger inicialmente).
2. Backend scaffolding módulos + SlugService + endpoints principales.
3. Frontend scaffolding componentes/servicios (UI mínima + theme variables).
4. Integración SEO (extender sitemap y structured data) y Homepage dynamic.
5. Testing: unit (services), e2e (pages + menu), performance re‑verificación.

### V - Verificación / Criterios

- Pages CRUD funcional + status + SEO campos.
- Un solo homepage garantizado tras operación set-homepage.
- Menú dinámico refleja orden y visibilidad; soporta tipos distintos.
- Tema activo aplica variables CSS y separa estilos admin/público.
- Slug único global validado en create/update (posts y pages).
- Sitemap incluye páginas publicadas; meta tags correctos en SSR.

### Scaffolding (Definición)

Scaffolding es el andamiaje inicial de código generado (o escrito rápidamente) que establece la estructura mínima: módulos, controladores, servicios, DTOs, entidades y rutas básicas sin todavía toda la lógica de negocio madura. Permite iterar con base consistente, añadir lógica fina y tests sobre piezas ya posicionadas en el árbol del proyecto.

---

## Stack

- Nx 21 (orquestación)
- Backend: NestJS 11, Prisma, PostgreSQL
- Frontend: Angular 20 (signals, SSR), Tailwind
- Librerías internas compartidas (`libs/shared-types`, `libs/utils`, `libs/database`)
- Testing: Jest (unit), Cypress (e2e placeholder)
- Validación: class-validator / class-transformer
- Logging: middleware requestId + duración (winston JSON)
- SEO: servicio central `SeoService` (title, meta, canonical, og, twitter)
- Seguridad/perf: Helmet configurado y compresión gzip

## Requisitos previos

- Node 18+

Monorepo con Backend NestJS + Prisma y Frontend Angular 20 (SSR) para un blog con búsqueda, paginación, SEO, caché y logging estructurado.

## 1. Stack

- Nx 21
- NestJS 11 + Prisma + PostgreSQL
- Angular 20 (standalone + signals + SSR) + Tailwind
- Librerías internas: `shared-types`, `utils`, `database`
- Testing: Jest (unit), Cypress (journey e2e)
- Seguridad / Perf: Helmet, compresión
- Logging: Winston JSON con correlación requestId
- SEO: `SeoService` central (title/meta/og/twitter/canonical)

## 2. Requisitos previos

- Node 18+
- Postgres local o Docker
- npm

## 3. Variables de entorno

| Variable | Req | Default | Descripción |
|----------|-----|---------|-------------|
| DATABASE_URL | Sí | - | Cadena conexión PostgreSQL |
| PORT | No | 3000 | Puerto backend |
| SITE_URL | No | <http://localhost:4000> | Base canónicos/SEO |
| NODE_ENV | No | development | Entorno |
| POSTS_CACHE_TTL_MS | No | 30000 | TTL (ms) caché listados |

Ejemplo `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/cms?schema=public
SITE_URL=http://localhost:4200
```

## 4. Instalación

```bash
npm install
npm run bootstrap
```

## 5. Scripts

| Comando | Descripción |
|---------|-------------|
| start:backend | NestJS dev |
| start:frontend | Angular SSR dev |
| build:backend | Build backend |
| build:frontend | Build frontend |
| test | Unit tests (todos) |
| test:coverage | Unit tests con cobertura |
| prisma:migrate | Migraciones Prisma (dev) |
| prisma:seed | Seed demo |
| bootstrap | migrate + seed |
| e2e | Cypress journey (orquesta DB + backend + frontend) |

## 6. Flujo rápido dev

1. Configura `.env`
2. `npm install`
3. `npm run bootstrap`
4. `npm run start:backend` + `npm run start:frontend`
5. Visita `http://localhost:4200` (o `:4300` vía script E2E)

## 7. Arquitectura

```text
apps/
    backend/
    frontend/
libs/
    database/
    utils/
    shared-types/
prisma/
    schema.prisma
    seed.ts + seed.cjs
tools/
    e2e-server.js
```

## 8. Modelos Prisma (extracto)

User: id, name, email (unique), slug (unique, required), bio?, avatarUrl?, createdAt, updatedAt

Post: id, title, slug (unique), excerpt?, content, status (DRAFT|PUBLISHED|ARCHIVED), authorId, readingTime, viewCount (default 0), publishedAt?, createdAt, updatedAt

Enum PostStatus: DRAFT, PUBLISHED, ARCHIVED

Índices relevantes: slug en User/Category/Tag/Post; status en Post.

## 9. Backend

Módulos: Posts, Search, Public (rutas cortas). (Servicios Category/Tag/Author se concentran en PostsService por simplicidad.)

Middleware: requestContext (requestId), requestLogger (Winston), redirects 301 legacy.

Interceptors / Filters: ResponseInterceptor, HttpErrorFilter.

Caching: listado paginado en memoria (clave por query). Invalidación: al incrementar vistas de un post (detalle). Futuro: invalidación selectiva por creación/actualización y backend store (Redis).

## 10. Frontend

Angular standalone + signals. Páginas: home, post, category, tag, author, search. `SeoService` con guard SSR para document.

## 11. Endpoints REST & Admin
 
## 11.1 Cobertura y Quality Gates

Temporalmente los umbrales globales de cobertura se redujeron a (backend y frontend): statements 60 / branches 40 / functions 55 / lines 60 para permitir integración continua estable mientras se escriben tests específicos de nuevas rutas dinámicas y menú jerárquico. TODO: volver a (backend 85/70/80/85, frontend 70/50/65/70) en próximas iteraciones.


| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /posts?page&limit | Listado general |
| GET | /category/:slug?page&limit | Por categoría (recursivo) |
| GET | /tag/:slug?page&limit | Por tag |
| GET | /author/:slug?page&limit | Por autor (slug) |
| GET | /posts/:slug | Detalle (↑ vistas + invalida caché) |
| GET | /posts/:slug/related | Relacionados (≤5) |
| GET | /search?q&page&limit | Búsqueda (≥2 chars) |
| GET | /search/suggest?q | Sugerencias básicas |

Redirects 301 activos:

| Origen | Destino |
|--------|---------|
| /posts/category/:slug | /category/:slug |
| /posts/tag/:slug | /tag/:slug |
| /posts/author/:id | /author/:slug |
| /search/posts | /search |

Política: mantener 301 ≥30 días; luego opcional 410 en rutas obsoletas.

Formato éxito:

```json
{"success":true,"message":"OK","data":[],"meta":{"total":0,"page":1,"limit":10,"totalPages":0}}
```

Formato error:

```json
{"success":false,"message":"Not Found","statusCode":404,"path":"/posts/x","timestamp":"2025-08-15T12:00:00.000Z"}

### 11.1. Consola Admin (Auth + Roles + Ownership + Auditoría)

Características implementadas Release 2:

- Autenticación JWT (access 15m, refresh 7d) + refresh transparente frontend.
- Lockout tras 5 intentos fallidos durante 15 min + throttle 5/min en login.
- Roles: `ADMIN`, `AUTHOR` (soportado). `ADMIN` ve todos los posts; `AUTHOR` sólo sus posts (scoping en `findAll` y `OwnershipGuard` en update/delete).
- OwnershipGuard: impide editar/eliminar si no eres autor salvo que tengas rol `ADMIN`.
- Auditoría: LOGIN, REFRESH, CREATE, UPDATE, DELETE (Post) registradas en `AuditLog`.
- Sanitización HTML con `sanitize-html` (whitelist extendida para headings/img) + cálculo readingTime.
- CRUD Taxonomías (categorías y tags) + asignación múltiple en posts.
- Filtros avanzados: status, categoría, tag, búsqueda full-text (title/content contains) + paginación.
- Editor Rich Text (Quill) con import dinámico + fallback.
- Interceptores frontend: auth (refresh), loading overlay, error (toasts centralizados).
- Response envelope backend uniforme (éxito / error) vía `ResponseInterceptor`.

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | /admin/auth/login | Público | Devuelve `{accessToken, refreshToken, roles}` (envuelto en `data`) |
| POST | /admin/auth/refresh | Público (refresh válido) | Renueva par de tokens (incluye roles) |
| GET | /admin/posts | ADMIN | Lista todos los posts |
| GET | /admin/posts/:id | ADMIN | Detalle por id |
| POST | /admin/posts | ADMIN | Crear post (DRAFT/PUBLISHED) |
| PUT | /admin/posts/:id | ADMIN | Actualizar (auditoría) |
| DELETE | /admin/posts/:id | ADMIN | Eliminar |
| GET | /admin/dashboard/overview | ADMIN | Métricas resumidas |

Formato unificado (interceptor) en respuestas exitosas y de error; los tokens de login/refresh se ubican en `data.accessToken` y `data.refreshToken`.

Ejemplo login (tokens + roles):

```json
{
    "success": true,
    "message": "OK",
    "data": {
        "accessToken": "<jwt>",
        "refreshToken": "<jwt>",
        "roles": ["ADMIN"]
    }
}
```

Errores de auth típicos:

| Código | Causa |
|--------|-------|
| 401 | Token ausente / inválido / refresh inválido |
| 403 | Rol insuficiente o violación de ownership |

### 11.2. Seguridad Auth & UX Admin

Lista de medidas:

- Access Token: expira en 15m
- Refresh Token: expira en 7d
- Lockout: 5 intentos fallidos -> cuenta bloqueada 15 min
- Throttling login: 5 req / 60s
- Frontend Admin: interceptor de refresh transparente + spinner global (overlay) cuando hay peticiones en curso + notificaciones toast.
- RoleGuard (frontend) actualmente exige solo `ADMIN` en rutas; añadir nuevos roles requerirá únicamente ampliar arrays en rutas y provisioning de usuarios.

## 12. OpenAPI & Tipos de Cliente

Generación offline del spec (aplica wrapper `success/message/data` automáticamente) y tipos TypeScript reutilizables.

Scripts:

| Comando | Acción |
|---------|--------|
| `npm run openapi:gen` | Genera `swagger.json` (build backend + extracción) |
| `npm run openapi:types` | Genera spec y tipos en `libs/shared-types/src/lib/openapi-types.ts` |

Tipos genéricos exportados:

```ts
import { ApiResponse, ApiSuccess, ApiError } from '@cms-workspace/shared-types';

function handle<T>(resp: ApiResponse<T>) {
    if (resp.success) {
        // resp.data es T
    } else {
        // resp.message / resp.statusCode
    }
}
```

Uso de un tipo de endpoint (ejemplo login) generado:

```ts
import type { components } from '@cms-workspace/shared-types';
type AuthTokens = components['schemas']['AuthTokensDto'];
```

Recomendado: regenerar tipos tras cambiar DTOs o decoradores Swagger.

- Auditoría: LOGIN, REFRESH, CREATE, UPDATE, DELETE (Post)
- Sanitización HTML: `sanitize-html` en create/update
- CORS y Helmet configurados (ver `main.ts`)


## 12. SEO

`SeoService.set()` maneja title/meta/og/twitter/canonical (idempotente). `SITE_URL` para canónicos absolutos.

## 13. Logging

Formato Winston JSON por línea.

Ejemplo:

```json
{"level":"info","message":"http_request","method":"GET","path":"/posts","statusCode":200,"durationMs":42,"requestId":"abc123"}
```

Eventos: `http_request`, `app_started`. Niveles configurables por `LOG_LEVEL` (futuro – pendiente variable).

## 14. Testing & Coverage

Unit tests: `npm test` / `npm run test:coverage`.

Threshold frontend: Statements 60%, Branches 40%, Functions 55%, Lines 60%. (Expandible tras añadir más specs.)

E2E journey (`npm run e2e`): home -> primer post -> back. Script `tools/e2e-server.js` levanta DB (5433 host), migra, seed, back (3000), front (4300) y lanza Cypress.

E2E adicionales internos (backend) incluyen flujo admin mockeado: login -> crear borrador -> publicar -> listar (ver `admin-journey-e2e.spec.ts`).

Próximos E2E: búsqueda, category->post, tag->post, author, paginación, búsqueda sin resultados.

### 14.1 Performance Script

Script de sembrado + micro benchmarks clave admin: `backend/src/scripts/perf.seed-and-test.ts`.

Genera (si faltan) ~N posts (por defecto 1000) y mide:

- LIST drafts (page1)
- LIST published (page1)
- CREATE post
- UPDATE (publish)

Uso (backend levantado en 3000) vía script npm:

```bash
npm run perf:admin
```

O manual con variables:

```bash
BASE_URL=http://localhost:3000 PERF_COUNT=1200 npx ts-node -r tsconfig-paths/register backend/src/scripts/perf.seed-and-test.ts
```

Salida ejemplo:

```text
[PERF] Preparando seed y tests: base http://localhost:3000 count 1000
[PERF] Seed listo
[PERF] LIST drafts page1         42.3ms
[PERF] LIST published page1      40.8ms
[PERF] CREATE post               28.5ms
[PERF] UPDATE post publish       31.2ms
```

Interpretación rápida:

- LIST ≤ 60ms en dataset 1k considerado OK local.
- CREATE/UPDATE ≤ 80ms con Prisma local aceptable; revisar índices si supera consistentemente.

## 15. Seed

`prisma/seed.ts` crea un único usuario `admin@example.com` (rol ADMIN), categorías, tags y posts publicados con readingTime calculado.

## 16. Roadmap breve

- Más specs Cypress (buscar, taxonomías, author, paginación)
- Hardening refresh token rotation (lista negra / hash)
- Slug collisions / re-slugging (estrategia) futura
- Cache store externo (Redis) opcional
- Observabilidad (tracing OpenTelemetry + métricas, Prometheus exporter)
- i18n
- Modo lectura offline (PWA) para frontend público

## 17. Licencia

MIT

---
`npx nx graph` para visualización de dependencias.

- (Pendiente) Completar suite Cypress (flujos: home -> post -> búsqueda -> categoría/tag).
- Internacionalización (i18n) futura.

## Licencia

MIT

---
Monorepo gestionado con Nx. Usa `npx nx graph` para visualizar dependencias.
