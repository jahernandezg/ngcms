#!/usr/bin/env node
const { spawn } = require('child_process');
const net = require('net');

function checkPort(port, host = '127.0.0.1', timeoutMs = 500) {
  return new Promise(resolve => {
    const socket = net.createConnection(port, host);
    let done = false;
    const finish = (result) => {
      if (done) return; done = true; socket.destroy(); resolve(result);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    setTimeout(() => finish(false), timeoutMs);
  });
}

function waitForPort(port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function probe() {
      const socket = net.createConnection(port, '127.0.0.1');
      socket.on('connect', () => { socket.end(); resolve(true); });
      socket.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('Timeout waiting for port ' + port));
        setTimeout(probe, 500);
      });
    })();
  });
}

async function resolveDatabase() {
  // Try direct local Postgres (5433) first
  if (await checkPort(5433)) {
    return { port: 5433, url: process.env.DATABASE_URL || `postgresql://postgres:postgres@localhost:5433/cms?schema=public` };
  }
  // Try docker-mapped port 5433
  if (await checkPort(5433)) {
    return { port: 5433, url: `postgresql://postgres:postgres@localhost:5433/cms?schema=public` };
  }
  // Attempt to start docker compose db
  console.warn('[e2e] Starting postgres container via docker compose...');
  await new Promise((res, rej) => {
    const dc = spawn('docker', ['compose', 'up', '-d', 'db'], { stdio: 'inherit', shell: true });
    dc.on('exit', code => code === 0 ? res(null) : rej(new Error('docker compose up failed')));
  });
  // Wait for mapped port 5433 (as per docker-compose.yml)
  const start = Date.now();
  while (!(await checkPort(5433))) {
    if (Date.now() - start > 30000) throw new Error('Timeout waiting for postgres on 5433');
    await new Promise(r => setTimeout(r, 500));
  }
  return { port: 5433, url: `postgresql://postgres:postgres@localhost:5433/cms?schema=public` };
}

async function main() {
  const db = await resolveDatabase();
  process.env.DATABASE_URL = db.url;
  console.warn(`[e2e] Using DATABASE_URL=${process.env.DATABASE_URL}`);

  // Seed / migrate DB
  await new Promise((res, rej) => {
    const p = spawn('npm', ['run', 'bootstrap'], { stdio: 'inherit', shell: true, env: { ...process.env, DATABASE_URL: db.url, ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com', ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'changeme' } });
    p.on('exit', code => code === 0 ? res(null) : rej(new Error('bootstrap failed')));
  });

  const backend = spawn('npx', ['nx', 'serve', 'backend'], { stdio: 'inherit', shell: true, env: { ...process.env, DATABASE_URL: db.url } });
  await waitForPort(3000, 60000);
  const frontend = spawn('npx', ['nx', 'serve', 'frontend', '--port=4300', '--verbose'], { stdio: 'inherit', shell: true, env: { ...process.env, API_URL: 'http://localhost:3000/api', DATABASE_URL: db.url } });

  backend.on('exit', code => process.exit(code || 1));
  frontend.on('exit', code => process.exit(code || 1));
}

main().catch(err => { console.error(err); process.exit(1); });
