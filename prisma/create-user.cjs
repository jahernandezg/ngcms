// Script CLI para crear/actualizar un usuario real en la BD
// Uso:
//  node prisma/create-user.cjs --email=you@example.com --name="Tu Nombre" --password="secreto123" --roles=ADMIN,AUTHOR
//  Variables alternativas (si no pasas flags): USER_EMAIL, USER_NAME, USER_PASSWORD, USER_ROLES

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

function parseArgs(argv) {
  const args = {};
  for (const part of argv.slice(2)) {
    const m = part.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

async function ensureUniqueSlug(prisma, baseSlug, currentUserId = null) {
  let slug = baseSlug || 'user';
  let i = 1;
  // Permitir conservar el slug si pertenece al mismo usuario
  while (true) {
    const existing = await prisma.user.findUnique({ where: { slug } });
    if (!existing || (currentUserId && existing.id === currentUserId)) return slug;
    i += 1;
    slug = `${baseSlug}-${i}`.substring(0, 60);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const email = args.email || process.env.USER_EMAIL;
  const name = args.name || process.env.USER_NAME;
  const password = args.password || process.env.USER_PASSWORD;
  const rolesRaw = args.roles || process.env.USER_ROLES || '';
  const roles = rolesRaw ? rolesRaw.split(',').map((r) => r.trim()).filter(Boolean) : [];

  if (!email || !name || !password) {
    console.error('Faltan datos. Requiere --email, --name y --password (o variables USER_EMAIL, USER_NAME, USER_PASSWORD).');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('El password debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    const baseSlug = slugify(name);
    const targetSlug = await ensureUniqueSlug(prisma, baseSlug, existingByEmail?.id || null);
    const passwordHash = await bcrypt.hash(password, 10);

    if (existingByEmail) {
      const updated = await prisma.user.update({
        where: { email },
        data: {
          name,
          slug: targetSlug,
          passwordHash,
          roles: roles.length ? roles : existingByEmail.roles,
        },
      });
  console.warn(JSON.stringify({ status: 'updated', id: updated.id, email: updated.email, slug: updated.slug, roles: updated.roles }));
    } else {
      const created = await prisma.user.create({
        data: {
          name,
          email,
          slug: targetSlug,
          passwordHash,
          roles,
        },
      });
  console.warn(JSON.stringify({ status: 'created', id: created.id, email: created.email, slug: created.slug, roles: created.roles }));
    }
  } catch (err) {
    console.error('Error creando/actualizando usuario:', err?.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
