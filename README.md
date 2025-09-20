# NGCMS – Monorepo (Nx)

Aplicación CMS/blog moderna con Angular 20 (standalone + signals + SSR) y NestJS + Prisma + PostgreSQL, organizada como monorepo Nx. Incluye listado/detalle de posts, búsqueda, categorías, tags, páginas estáticas, menú dinámico, tematización base, autenticación con JWT (access/refresh), roles (ADMIN/AUTHOR) y consola de administración.

[![CI](https://github.com/jahernandezg/ngcms/actions/workflows/ci.yml/badge.svg)](https://github.com/jahernandezg/ngcms/actions/workflows/ci.yml)
[![Deploy](https://github.com/jahernandezg/ngcms/actions/workflows/deploy.yml/badge.svg)](https://github.com/jahernandezg/ngcms/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-20-DD0031?logo=angular&logoColor=white)](https://angular.io)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Nx](https://img.shields.io/badge/Nx-21-143?logo=nx&logoColor=white&color=0f172a)](https://nx.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cypress](https://img.shields.io/badge/E2E-Cypress-17202C?logo=cypress&logoColor=white)](https://www.cypress.io)
[![Jest](https://img.shields.io/badge/Tests-Jest-C21325?logo=jest&logoColor=white)](https://jestjs.io)

* * *

## Tabla de Contenidos
- Tecnologías utilizadas
- Funcionalidades (MVP vigente)
- Arquitectura técnica y endpoints
- Cómo ejecutar el proyecto (Dev y Docker Compose)
- Variables de entorno
- Scripts disponibles
- Estructura del repositorio
- Roadmap y próximas mejoras
- Contribuir y licencia

* * *

## Tecnologías utilizadas
- Frontend: Angular 20 (standalone, signals, SSR), Tailwind, Angular CDK/Material (base en Admin)
- Backend: NestJS 11, Prisma, PostgreSQL
- Monorepo: Nx 21
- Seguridad: JWT (access 15m, refresh 7d), roles ADMIN/AUTHOR, Helmet, rate limiting + lockout
- Testing: Jest (unit), Cypress (E2E)
- DevOps: Docker Compose (db/backend/frontend), GitHub Actions (CI/CD)

## Funcionalidades (MVP vigente)
- Público (SSR):
  - Listado y detalle de posts con paginación, filtros (categoría, tag, autor), búsqueda básica, related posts
  - Páginas estáticas (CRUD), homepage única, menú dinámico jerárquico, base de tematización tipo Medium
  - SEO inicial: title/meta/canonical, OG/JSON‑LD en páginas, sitemap y robots.txt
- Administración:
  - Autenticación JWT (access/refresh), roles ADMIN/AUTHOR (ownership aplicado)
  - CRUD de posts (DRAFT|PUBLISHED), páginas, menú; dashboard con métricas básicas
  - Upload de imagen destacada (featured) por post con validación 16:9, compresión y thumbnails
  - BlogConfig central: branding (logos, favicon, og), SEO básico, sociales y parámetros técnicos
- Calidad/Operativa:
  - Respuesta API uniforme { success, message, data, meta }, logging con requestId
  - Objetivo cobertura vigente ≥60% (Jest + Cypress)

> Resumen detallado por release y plan futuro: ver ROADMAP.md

## Arquitectura técnica y endpoints
- Esquema de datos (Prisma): User, Post, Category, Tag, Page, MenuItem, ThemeSettings, BlogConfig, AuditLog (joins PostCategory/PostTag)
- Endpoints públicos:
  - GET /posts?page&limit | /posts/:slug | /posts/:slug/related
  - GET /category/:slug | /tag/:slug | /author/:id (migración futura a /author/:slug)
  - GET /search?q | /search/suggest?q | SEO: sitemap.xml, robots.txt
- Admin (/api/admin):
  - Auth: login, refresh
  - Posts/Páginas/Menú: CRUD, ordenación, publicar, set homepage
  - Temas: listar/activar/ajustes
- Configuración/Uploads:
  - GET/PUT /api/blog-config
  - POST /api/uploads/logo-light|logo-dark|favicon|og-image
  - POST/GET/DELETE /api/uploads/post-image

Más detalle y criterios de aceptación en ROADMAP.md.

## Cómo ejecutar el proyecto

### Opción A: Desarrollo local
Requisitos previos: Node 18+, npm, PostgreSQL local (o usar Opción B con Docker).

```bash
npm install
cp .env.example .env
npm run bootstrap   # prisma migrate + seed

# En dos terminales
npm run start:backend   # http://localhost:3000
npm run start:frontend  # SSR en http://localhost:4000 (o 4200 según config)
```

Notas:
- Variables por defecto en .env apuntan a PostgreSQL en localhost:5433 (ver compose dev).
- Script alternativo Windows (backend): `npm run start:backend:ps`.

### Opción B: Docker Compose (db + backend + frontend)

```bash
docker compose up --build
# Backend:  http://localhost:3000
# Frontend: http://localhost:4000
```

Archivos disponibles: `docker-compose.yml`, `docker-compose.prod.yml`, `docker-compose.deploy.yml`.

## Variables de entorno
Ejemplo base (.env.example):

- NODE_ENV=development
- SITE_URL=http://localhost:4200
- DATABASE_URL=postgresql://postgres:postgres@localhost:5433/cms?schema=public
- PORT=3000
- POSTS_CACHE_TTL_MS=30000
- JWT_ACCESS_SECRET=change_me_access
- JWT_REFRESH_SECRET=change_me_refresh
- (Prod) CORS_ORIGINS, API_BASE, SSR_MICROCACHE, POSTGRES_*

## Scripts disponibles
Desde package.json:

- start:backend / start:frontend / build:backend / build:frontend
- test / test:coverage / lint / e2e
- prisma:generate / prisma:migrate / prisma:seed / bootstrap
- openapi:gen / openapi:types / openapi:all
- user:create / user:create:env
- perf:admin

## Estructura del repositorio (resumen)
```
backend/        # NestJS (módulos, controladores, servicios, scripts perf)
frontend/       # Angular 20 SSR (público + consola admin)
libs/           # Librerías compartidas (shared-types, utils, database)
prisma/         # schema.prisma, migraciones y seed
scripts/        # utilidades y mantenimiento
uploads/        # assets subidos (logos, og, featured images)
```

## Roadmap y próximas mejoras
Consulta el documento completo: [ROADMAP.md](./ROADMAP.md)

- Fase 1 en curso:
  - R1.6 Performance: caching multinivel, Deferrable Views/deferred loading, PWA inicial, CWV objetivos
  - R1.7 Hardening (será construido): control flow Angular (@if/@for), Signals ampliamente, Admin UX (Material + Tailwind), CRUD taxonomías, rotación de refresh tokens, 2FA opcional, auditoría ampliada, OpenAPI completa
- Fases siguientes (será construido):
  - Media Management avanzado (chunked uploads, multi‑storage, antivirus, librería multimedia)
  - SEO avanzado, Performance Pro, Plataforma de cursos/LMS, Monetización, Plugins, Themes y API Management

## Contribuir y licencia
- Guía: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Licencia: [MIT](./LICENSE)

---

Monorepo gestionado con Nx. `npx nx graph` para visualizar dependencias.
