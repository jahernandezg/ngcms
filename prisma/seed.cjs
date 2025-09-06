// Runtime JS seed (cjs) para evitar problemas con ts-node en Node 22 ESM
const { PrismaClient, PostStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}
function calcReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
const prisma = new PrismaClient();

async function main() {
  const adminName = 'Site Admin';
  const adminSlug = slugify(adminName);
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPlainPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminPasswordHash = await bcrypt.hash(adminPlainPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, slug: adminSlug, roles: ['ADMIN'], passwordHash: adminPasswordHash },
    create: { name: adminName, email: adminEmail, slug: adminSlug, passwordHash: adminPasswordHash, roles: ['ADMIN'] },
  });
  const authorName = 'Author Demo';
  const authorSlug = slugify(authorName);
  const authorPasswordHash = await bcrypt.hash('author123', 10);
  const author = await prisma.user.upsert({
    where: { email: 'author@example.com' },
    update: { name: authorName, slug: authorSlug, roles: ['AUTHOR'], passwordHash: authorPasswordHash },
    create: { name: authorName, email: 'author@example.com', slug: authorSlug, passwordHash: authorPasswordHash, roles: ['AUTHOR'] },
  });

  const catTech = await prisma.category.upsert({ where: { slug: 'technology' }, update: {}, create: { name: 'Technology', slug: 'technology' } });
  const catAngular = await prisma.category.upsert({ where: { slug: 'angular' }, update: {}, create: { name: 'Angular', slug: 'angular', parentId: catTech.id } });
  const tagNx = await prisma.tag.upsert({ where: { slug: 'nx' }, update: {}, create: { name: 'Nx', slug: 'nx' } });
  const tagNest = await prisma.tag.upsert({ where: { slug: 'nestjs' }, update: {}, create: { name: 'NestJS', slug: 'nestjs' } });

  const postsData = [
    { title: 'Bienvenido al CMS Blog con Angular 20 + NestJS', excerpt: 'MVP de blog full-stack con Nx, Angular 20 y NestJS', content: 'Contenido de ejemplo '.repeat(20), categories: [catAngular.id], tags: [tagNx.id, tagNest.id] },
    { title: 'Productividad con Nx en Monorepos TypeScript', excerpt: 'Acelera builds y testing incremental con Nx.', content: 'Nx permite orquestar tareas '.repeat(25), categories: [catTech.id], tags: [tagNx.id] },
    { title: 'Buenas prácticas en NestJS para APIs limpias', excerpt: 'Estructura modular, servicios y DTOs para escalabilidad.', content: 'NestJS aprovecha decoradores '.repeat(30), categories: [catTech.id], tags: [tagNest.id] },
  ];
  for (const p of postsData) {
    const slug = slugify(p.title);
    await prisma.post.upsert({
      where: { slug },
      update: {},
      create: {
        title: p.title,
        slug,
        excerpt: p.excerpt,
        content: p.content,
        status: PostStatus.PUBLISHED,
        readingTime: calcReadingTime(p.content),
        authorId: admin.id,
        publishedAt: new Date(),
        categories: { create: p.categories.map((cid) => ({ categoryId: cid })) },
        tags: { create: p.tags.map((tid) => ({ tagId: tid })) },
      },
    });
  }

  // Theme settings
  const existingTheme = await prisma.themeSettings.findFirst({ where: { name: 'medium' } });
  const themeData = { isActive: true, primaryColor: '#f9d923', secondaryColor: '#000000', customCss: ':root{--color-bg:#ffffff;--color-text:#111827;}' };
  if (existingTheme) {
    await prisma.themeSettings.update({ where: { id: existingTheme.id }, data: themeData });
  } else {
    await prisma.themeSettings.create({ data: { name: 'medium', ...themeData } });
  }

  // About/Homepage
  await prisma.page.upsert({
    where: { slug: 'about' },
    update: { isHomepage: true, status: 'PUBLISHED' },
    create: { title: 'About Me', slug: 'about', content: 'Página About inicial. '.repeat(20), excerpt: 'Página About inicial', status: 'PUBLISHED', isHomepage: true, authorId: admin.id },
  });

  // Draft post author
  await prisma.post.upsert({ where: { slug: 'primer-draft-author' }, update: {}, create: { title: 'Primer Draft del Author', slug: 'primer-draft-author', content: 'Contenido borrador '.repeat(10), status: PostStatus.DRAFT, readingTime: 1, authorId: author.id } });

  // Menu inicial
  const menuCount = await prisma.menuItem.count();
  if (menuCount === 0) {
    const homepage = await prisma.page.findFirst({ where: { isHomepage: true } });
    const techCat = await prisma.category.findUnique({ where: { slug: 'technology' } });
    let sort = 0;
    if (homepage) await prisma.menuItem.create({ data: { title: 'Home', slug: slugify('Home'), type: 'PAGE', targetId: homepage.id, sortOrder: sort++ } });
    await prisma.menuItem.create({ data: { title: 'Blog', slug: slugify('Blog'), type: 'BLOG_INDEX', sortOrder: sort++ } });
    if (homepage && homepage.slug !== 'about') {
      const aboutPage = await prisma.page.findUnique({ where: { slug: 'about' } });
      if (aboutPage) await prisma.menuItem.create({ data: { title: 'About', slug: slugify('About'), type: 'PAGE', targetId: aboutPage.id, sortOrder: sort++ } });
    }
    if (techCat) await prisma.menuItem.create({ data: { title: 'Technology', slug: slugify('Technology'), type: 'CATEGORY', targetId: techCat.id, sortOrder: sort++ } });
    await prisma.menuItem.create({ data: { title: 'GitHub', slug: slugify('GitHub'), type: 'EXTERNAL_LINK', url: 'https://github.com/', openNewWindow: true, sortOrder: sort++ } });
  }
  // Site Settings default
  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: { siteName: 'CMS Demo', tagline: 'MVP rápido con Angular + Nest', defaultMetaDesc: 'CMS MVP generado con Nx', logoUrl: null },
    create: { id: 'default', siteName: 'CMS Demo', tagline: 'MVP rápido con Angular + Nest', defaultMetaDesc: 'CMS MVP generado con Nx' }
  });
  // BlogConfig default
  const cfg = await prisma.blogConfig.findFirst();
  if (!cfg) {
    await prisma.blogConfig.create({
      data: {
        blogName: 'Mi Blog Tech',
        description: 'Blog sobre desarrollo y tecnología',
        siteUrl: 'http://localhost:4200',
        locale: 'es-ES',
        timezone: 'Europe/Madrid',
        postsPerPage: 10,
        enableComments: true,
        metaDescription: 'El mejor blog de tecnología en español',
      }
    });
  }
  console.warn('Seed completada (cjs).');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
