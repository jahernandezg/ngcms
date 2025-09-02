#!/usr/bin/env node
/*
  Fail if an existing migration (not the latest one) was modified.
*/
const { execSync } = require('child_process');

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

try {
  // Get changed files in prisma/migrations
  const changed = sh('git diff --name-only --cached -- prisma/migrations').split(/\r?\n/).filter(Boolean);
  if (changed.length === 0) process.exit(0);

  // Determine latest migration dir
  const dirs = sh('ls -1 prisma/migrations').split(/\r?\n/).filter(Boolean).sort();
  const latest = dirs[dirs.length - 1];

  // If any changed path is not under latest, fail
  const invalid = changed.filter(p => !p.includes(`/prisma/migrations/${latest}/`));
  if (invalid.length > 0) {
    console.error('\n[validate-migrations] No modifiques migraciones ya aplicadas. Crea una nueva en su lugar.');
    console.error('[validate-migrations] Cambios detectados fuera de la última migración:', invalid.join('\n - '));
    process.exit(1);
  }
  process.exit(0);
} catch (_e) {
  // Non-fatal on environments without git (CI will catch anyway)
  process.exit(0);
}
