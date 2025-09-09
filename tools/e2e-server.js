#!/usr/bin/env node
const { spawn } = require('child_process');
const net = require('net');

// Pequeña utilidad de espera
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function checkPort(port, host = '127.0.0.1', timeoutMs = 500) {
  return new Promise((resolve) => {
    const socket = net.createConnection(port, host);
    let done = false;
    const finish = (result) => {
  if (done) return;
  done = true;
  try { socket.destroy(); } catch (/* ignore */ _err) { /* noop */ }
      resolve(result);
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

async function checkHealth(baseUrl, attempts = 3, intervalMs = 1000) {
  const url = baseUrl.replace(/\/$/, '') + '/health';
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
  } catch (/* ignore */ _e) { /* noop */ }
    await sleep(intervalMs);
  }
  return false;
}

async function waitForHealth(baseUrl, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkHealth(baseUrl, 1)) return true;
    await sleep(500);
  }
  throw new Error('Timeout esperando health en ' + baseUrl);
}

async function ensureBackend() {
  const backendPort = 3000;
  // Forzar IPv4 explícito para evitar que "localhost" resuelva a ::1 en algunos entornos CI
  const apiBase = process.env.API_URL || 'http://127.0.0.1:3000/api';
  let backendProcess;

  const portOpen = await checkPort(backendPort);
  let healthy = false;
  if (portOpen) {
    healthy = await checkHealth(apiBase, 5, 500);
  }

  if (!portOpen || !healthy) {
    if (portOpen && !healthy) {
      console.warn('[e2e] Puerto 3000 ocupado pero /api/health no responde. Intentando iniciar backend igualmente...');
    } else {
      console.warn('[e2e] Backend no detectado (o no sano). Iniciando "nx serve backend"...');
    }
    backendProcess = spawn('npx', ['nx', 'serve', 'backend'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env }
    });
  } else {
    console.warn('[e2e] Backend ya en ejecución y saludable en puerto 3000.');
  }

  // Esperar puerto y health
  await waitForPort(backendPort, 60000);
  await waitForHealth(apiBase, 60000);
  return backendProcess;
}

async function main() {
  const backend = await ensureBackend();

  // Start frontend dev server on 4300 if needed
  const frontendPort = 4300;
  let frontend;
  if (!(await checkPort(frontendPort))) {
    console.warn('[e2e] Frontend not detected on port 4300. Starting "nx serve frontend"...');
    frontend = spawn('npx', ['nx', 'serve', 'frontend', '--port=4300', '--verbose'], {
      stdio: 'inherit',
      shell: true,
  env: { ...process.env, API_URL: process.env.API_URL || 'http://127.0.0.1:3000/api' },
    });
  } else {
    console.warn('[e2e] Frontend already running on port 4300.');
  }
  // Ensure frontend is listening before Cypress starts
  await waitForPort(frontendPort, 90000);
  // Breve espera adicional para que el bundle inicial termine de exponer rutas
  await sleep(1000);

  if (backend) backend.on('exit', (code) => process.exit(code || 1));
  if (frontend) frontend.on('exit', (code) => process.exit(code || 1));
}

main().catch((err) => { console.error(err); process.exit(1); });
