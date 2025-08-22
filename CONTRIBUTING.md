# Contribuir

Gracias por tu interés en contribuir.

## Flujo básico

1. Crea un fork y clona.
2. Crea rama: `feat/descripcion-corta`.
3. Instala dependencias: `npm ci`.
4. Configura `.env` desde `.env.example`.
5. Ejecuta `npm run bootstrap`.
6. Corre lint y tests antes de commitear: `npm run lint && npm test`.
7. Commits usando Conventional Commits (ej: `feat(posts): añade búsqueda`).
8. Abre Pull Request describiendo cambios y motivación.

## Commits

Formato:

```text
<type>(<scope>): <mensaje>
```

Tipos: feat, fix, docs, refactor, test, chore, perf.

## Estilo de código

- TypeScript estricto.
- Evitar `any` salvo justificación.
- Funciones cortas; extraer helpers.

## Tests

- Añade tests unitarios para lógica nueva.
- Actualiza snapshots si aplica.

## Seguridad

- No subir secretos reales.
- Revisa dependencias nuevas.

## Releases

SemVer derivado de Conventional Commits.
