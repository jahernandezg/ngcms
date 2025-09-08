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

async function main() {
  // If backend isn't already running, start it. Do NOT touch/migrate the DB here.
  const backendPort = 3000;
  let backend;
  if (!(await checkPort(backendPort))) {
    console.warn('[e2e] Backend not detected on port 3000. Starting "nx serve backend"...');
    backend = spawn('npx', ['nx', 'serve', 'backend'], { stdio: 'inherit', shell: true, env: { ...process.env } });
  } else {
    console.warn('[e2e] Backend already running on port 3000.');
  }
  await waitForPort(backendPort, 60000);

  // Start frontend dev server on 4300 if needed
  const frontendPort = 4300;
  let frontend;
  if (!(await checkPort(frontendPort))) {
    console.warn('[e2e] Frontend not detected on port 4300. Starting "nx serve frontend"...');
    frontend = spawn('npx', ['nx', 'serve', 'frontend', '--port=4300', '--verbose'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, API_URL: process.env.API_URL || 'http://localhost:3000/api' },
    });
  } else {
    console.warn('[e2e] Frontend already running on port 4300.');
  // Esperar a que el frontend esté escuchando también (Vite/Nx tarda un poco)
  await waitForPort(frontendPort, 90000);
  }

  if (backend) backend.on('exit', code => process.exit(code || 1));
  if (frontend) frontend.on('exit', code => process.exit(code || 1));
}

main().catch(err => { console.error(err); process.exit(1); });
