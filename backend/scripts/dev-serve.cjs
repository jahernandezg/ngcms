#!/usr/bin/env node
/*
  Dev serve para backend (cross-platform):
  - Lanza webpack en modo watch
  - Espera a que se genere dist/backend/main.js
  - Arranca Node sobre dist/backend/main.js y reinicia en cambios
*/
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
// Cargar .env si existe y establecer defaults locales para desarrollo/E2E
try {
  if (fs.existsSync(path.join(process.cwd(), '.env'))) {
    require('dotenv').config();
  }
} catch (_e) {
  // noop
}
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/cms?schema=public';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
process.env.PORT = process.env.PORT || '3000';

const distMain = path.join(process.cwd(), 'dist', 'backend', 'main.js');

let webpackProc = null;
let nodeProc = null;
let restarting = false;

// Defaults de entorno para desarrollo si no existen
process.env.PORT = process.env.PORT || '3000';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/cms?schema=public';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
// Nota: en CI ya se establecen; aquí sólo damos valores por defecto locales

function startWebpackWatch() {
  webpackProc = spawn('npx', ['webpack', '--config', 'backend/webpack.config.js', '--watch'], { stdio: 'inherit', shell: true });
  webpackProc.on('exit', (code, sig) => {
    console.warn(`[dev-serve] webpack (watch) finalizó code=${code} signal=${sig}`);
    // Si webpack muere, matamos el server
    try { if (nodeProc && !nodeProc.killed) nodeProc.kill(); } catch (e) { console.warn('[dev-serve] error al matar node:', e && e.message); }
    process.exit(code ?? 0);
  });
}

function startNode() {
  if (nodeProc && !nodeProc.killed) {
    try { nodeProc.kill(); } catch { /* noop */ }
  }
  console.warn('[dev-serve] arrancando node dist/backend/main.js');
  nodeProc = spawn(process.execPath, [distMain], { stdio: 'inherit', env: process.env });
  nodeProc.on('exit', (code, sig) => {
    if (restarting) return; // reinicio esperado
  console.warn(`[dev-serve] node salió code=${code} signal=${sig}`);
  });
}

function waitForFile(file, cb) {
  const tryWait = () => {
    fs.access(file, fs.constants.F_OK, (err) => {
      if (!err) return cb();
      setTimeout(tryWait, 500);
    });
  };
  tryWait();
}

function watchAndRestart() {
  let debounce;
  const trigger = () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      // Esperar a que main.js exista antes de reiniciar
      waitForFile(distMain, () => {
        restarting = true;
        startNode();
        restarting = false;
      });
    }, 400);
  };
  try {
    // watch del archivo directamente
    fs.watch(path.dirname(distMain), (event, filename) => {
      if (filename === 'main.js') {
  console.warn(`[dev-serve] cambio detectado en ${filename} (${event})`);
        trigger();
      }
    });
  } catch (e) {
    console.warn('[dev-serve] fs.watch no disponible, no se reiniciará automáticamente:', e?.message);
  }
}

function shutdown() {
  console.warn('[dev-serve] terminando...');
  try { if (webpackProc && !webpackProc.killed) webpackProc.kill(); } catch (e) { console.warn('[dev-serve] error al matar webpack:', e && e.message); }
  try { if (nodeProc && !nodeProc.killed) nodeProc.kill(); } catch (e) { console.warn('[dev-serve] error al matar node:', e && e.message); }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Build inicial, luego arrancar node, luego watch para cambios
console.warn('[dev-serve] build inicial (webpack)');
const buildOnce = spawn('npx', ['webpack', '--config', 'backend/webpack.config.js', '--node-env=development'], { stdio: 'inherit', shell: true });
buildOnce.on('exit', (code) => {
  if (code !== 0) {
    console.error(`[dev-serve] build inicial falló con código ${code}`);
    process.exit(code);
    return;
  }
  waitForFile(distMain, () => {
    startNode();
    startWebpackWatch();
    watchAndRestart();
  });
});
