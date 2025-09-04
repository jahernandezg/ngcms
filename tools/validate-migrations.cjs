#!/usr/bin/env node
/* eslint-disable no-console */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

if (process.env.BYPASS_MIGRATION_GUARD === '1') {
  console.log('[validate-migrations] BYPASS activado.');
  process.exit(0);
}

const baseDir = 'prisma/migrations';
if (!fs.existsSync(baseDir)) process.exit(0);

const dirs = fs
  .readdirSync(baseDir)
  .filter((d) => fs.statSync(path.join(baseDir, d)).isDirectory())
  .sort();

if (dirs.length === 0) process.exit(0);

const last = dirs[dirs.length - 1];

// Archivos staged
const staged = execSync('git diff --name-only --cached', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

// Filtra migraciones que NO están en la última carpeta
let offenders = staged.filter(
  (f) => f.startsWith('prisma/migrations/') && !f.startsWith(`prisma/migrations/${last}/`)
);

// Ignora cambios que sean solo espacios/EOL
offenders = offenders.filter((f) => {
  try {
    const out = execSync(`git diff --cached --ignore-cr-at-eol --ignore-all-space -- ${f}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    // Si no hay diff “real” tras ignorar espacios/EOL, no es ofensor
    return out && out.trim().length > 0;
  } catch {
    // Si falla el diff, por seguridad lo dejamos como ofensor
    return true;
  }
});

if (offenders.length > 0) {
  console.error('[validate-migrations] No modifiques migraciones ya aplicadas. Crea una nueva en su lugar.');
  console.error('[validate-migrations] Cambios detectados fuera de la última migración:', offenders.join(', '));
  console.error('[validate-migrations] Puedes usar BYPASS_MIGRATION_GUARD=1 si es un merge con cambios históricos (no recomendado).');
  process.exit(1);
}

console.log('[validate-migrations] OK');
process.exit(0);
