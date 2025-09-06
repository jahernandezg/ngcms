import { waitForPortOpen } from '@nx/node/utils';
import { execSync, spawn } from 'child_process';
import * as net from 'net';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

module.exports = async function () {
  // Preparar DB (migrate + seed) y luego esperar al backend.
  console.log('\n[backend-e2e] Global setup...\n');

  // Defaults útiles para entorno local (GitHub Actions ya los define en job.env)
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/cms?schema=public';
  process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
  process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    console.log('[backend-e2e] prisma migrate deploy');
    execSync('npx prisma migrate deploy --schema=prisma/schema.prisma', { stdio: 'inherit' });
  } catch (e) {
    console.warn('[backend-e2e] migrate deploy falló, continúo por si ya estaba aplicada:', (e as Error)?.message);
  }

  try {
    console.log('[backend-e2e] prisma db seed');
    execSync('npx prisma db seed --schema=prisma/schema.prisma', { stdio: 'inherit' });
  } catch (e) {
    console.warn('[backend-e2e] seed falló, continúo por si ya estaba poblada:', (e as Error)?.message);
  }

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  // Comprobación rápida del puerto (300ms)
  const isOpen = await new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host, port });
    let resolved = false;
    const done = (val: boolean) => { if (!resolved) { resolved = true; try { socket.destroy(); } catch {} resolve(val); } };
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    setTimeout(() => done(false), 300);
  });
  if (!isOpen) {
    console.log('[backend-e2e] backend no detectado en puerto', port, '-> iniciando nx serve backend');
    spawn('npx', ['nx', 'serve', 'backend'], { stdio: 'inherit', shell: true, env: process.env });
  }
  await waitForPortOpen(port, { host });

  // Esperar a que el backend esté sano (no solo que el puerto esté abierto)
  try {
    const axios = require('axios');
    const base = `http://${host}:${port}`;
    const deadline = Date.now() + 60000; // hasta 60s
    let ok = false;
    while (Date.now() < deadline) {
      try {
        const res = await axios.get(base + '/api/health', { timeout: 2000, validateStatus: () => true });
        if (res.status === 200) { ok = true; break; }
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    if (!ok) console.warn('[backend-e2e] aviso: /api/health no respondió 200 antes del timeout');
  } catch (e) {
    console.warn('[backend-e2e] no se pudo comprobar /api/health:', (e as Error)?.message);
  }

  // Hint: Use `globalThis` to pass variables to global teardown.
  (globalThis as typeof globalThis & { __TEARDOWN_MESSAGE__?: string }).__TEARDOWN_MESSAGE__ =
    '\nTearing down...\n';
};
