#!/usr/bin/env node
// Añade la columna featuredImage a la tabla Post si no existe (workaround cuando migración Prisma falla por índice duplicado)
// Uso:
//   DATABASE_URL=postgresql://user:pass@host:port/db?schema=public node scripts/add-post-featured-image.cjs
// Requiere @prisma/client ya generado.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name='Post' AND column_name='featuredImage'`);
  const exists = Array.isArray(result) && result.length > 0;
  if (exists) {
    console.warn('[INFO] La columna Post.featuredImage ya existe. Nada que hacer.');
  } else {
    console.warn('[INFO] Creando columna Post.featuredImage...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."Post" ADD COLUMN IF NOT EXISTS "featuredImage" TEXT;`);
    console.warn('[OK] Columna creada.');
  }
}

main().catch(e => {
  console.error('[ERROR] Falló la adición de columna featuredImage:', e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
