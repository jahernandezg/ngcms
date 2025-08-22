/*
  Script de performance: genera ~1000 posts (alternando status) y mide tiempos de endpoints clave.
  Uso: ts-node -r tsconfig-paths/register backend/src/scripts/perf.seed-and-test.ts
*/
import { PrismaClient, PostStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureAdmin() {
  const email = 'perf-admin@example.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const password = await bcrypt.hash('secret', 10);
  return prisma.user.create({ data: { email, name: 'Perf Admin', slug: 'perf-admin', passwordHash: password, roles: ['ADMIN'] } });
}

function chunk<T>(arr: T[], size: number) { const out: T[][] = []; for (let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out; }

async function seedPosts(userId: string, count: number) {
  const existing = await prisma.post.count({ where: { authorId: userId } });
  if (existing >= count) return; // ya sembrado
  const toCreate = count - existing;
  const batch: { title: string; slug: string; content: string; status: PostStatus; authorId: string; readingTime: number }[] = [];
  for (let i=0;i<toCreate;i++) {
    const idx = existing + i + 1;
    const status = idx % 5 === 0 ? 'PUBLISHED' : 'DRAFT';
    const title = `Perf Post ${idx}`;
    batch.push({ title, slug: `perf-post-${idx}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`, content: 'lorem ipsum '.repeat(40), status: status as PostStatus, authorId: userId, readingTime: 3 });
  }
  for (const group of chunk(batch, 50)) {
    await prisma.post.createMany({ data: group });
  }
}

async function login(base: string) {
  const res = await fetch(base + '/api/admin/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'perf-admin@example.com', password: 'secret' }) });
  if (!res.ok) throw new Error('login failed ' + res.status);
  const body = await res.json();
  return body.data.accessToken as string;
}

async function time(name: string, fn: () => Promise<unknown>) {
  const start = performance.now();
  const result = await fn();
  const ms = performance.now() - start;
  console.error('[PERF]', name.padEnd(25), ms.toFixed(1)+'ms');
  return { ms, result };
}

async function measure(base: string, token: string) {
  const auth = { Authorization: 'Bearer ' + token };
  await time('LIST drafts page1', () => fetch(base + '/api/admin/posts?status=DRAFT&page=1&limit=20', { headers: auth }).then((r: Response) => r.json()));
  await time('LIST published page1', () => fetch(base + '/api/admin/posts?status=PUBLISHED&page=1&limit=20', { headers: auth }).then((r: Response) => r.json()));
  const created = await time('CREATE post', () => fetch(base + '/api/admin/posts', { method:'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ title:'Perf New Post', content:'Contenido de prueba performance '.repeat(3), excerpt:'Excerpt perf', status:'DRAFT' }) }).then((r: Response) => r.json().catch(()=>({ parseError:true }))));
  const createdBody = created.result as { success?: boolean; data?: { id?: string }; message?: string } | undefined;
  if (!createdBody?.data?.id) {
    console.error('[PERF] CREATE respuesta inesperada', createdBody);
    return; // aborta resto para no lanzar TypeError
  }
  const id = createdBody.data.id;
  await time('UPDATE post publish', () => fetch(base + '/api/admin/posts/'+id, { method:'PUT', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ status:'PUBLISHED' }) }).then((r: Response) => r.json().catch(()=>({ parseError:true }))));
}

async function detectBase(): Promise<string> {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const candidates = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3333',
  ];
  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const t = setTimeout(()=>controller.abort(), 1500);
      const resp = await fetch(url + '/api/posts?limit=1', { signal: controller.signal });
      clearTimeout(t);
      if (resp.ok) return url;
    } catch { /* ignore */ }
  }
  throw new Error('No se pudo detectar backend en candidatos. Define BASE_URL.');
}

async function main() {
  const base = await detectBase();
  const target = parseInt(process.env.PERF_COUNT || '1000', 10);
  console.error('[PERF] Preparando seed y tests: base', base, 'count', target);
  const admin = await ensureAdmin();
  await seedPosts(admin.id, target);
  console.error('[PERF] Seed listo');
  const token = await login(base);
  await measure(base, token);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
