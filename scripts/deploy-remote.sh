#!/usr/bin/env bash
set -Eeuo pipefail

# Helper alias
alias dco='docker compose -f docker-compose.deploy.yml'

# 1) Validar .env presente
if [[ ! -f .env ]]; then
  echo "ERROR: Falta el archivo .env junto a docker-compose.deploy.yml" >&2
  exit 1
fi

# 2) Levantar servicios
echo "[deploy] Levantando servicios..."
dco up -d

# 3) Esperar DB saludable
echo "[deploy] Esperando a que la DB acepte conexiones..."
if ! dco exec -T db pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-cms}" -t 5; then
  echo "[deploy] DB aún no lista, esperando 5s y reintentando..."
  sleep 5
  dco exec -T db pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-cms}" -t 5
fi

echo "[deploy] Ejecutando migraciones Prisma..."
if ! dco exec -T backend npx prisma migrate deploy; then
  echo "ERROR: Prisma migrate deploy falló" >&2
  exit 1
fi

# 4) Comprobar si hay que seedear (base vacía)
SEED_NEEDED="no"
SEED_NEEDED=$(dco exec -T db psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-cms}" -tAc "SELECT CASE WHEN COUNT(*)=0 THEN 'yes' ELSE 'no' END FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "err")

if [[ "$SEED_NEEDED" == "err" ]]; then
  echo "[deploy] Aviso: no se pudo ejecutar psql para verificar seed. Revisar logs de DB:" >&2
  dco logs db --tail=200 || true
elif [[ "$SEED_NEEDED" == "yes" ]]; then
  echo "[deploy] Base vacía: ejecutando seed..."
  if ! dco exec -T backend node prisma/seed.cjs; then
    echo "ERROR: seed falló" >&2
    exit 1
  fi
else
  echo "[deploy] Seed no requerido (tablas ya existen)."
fi

echo "[deploy] Actualizando servicios..."
dco up -d --remove-orphans

echo "[deploy] OK"
