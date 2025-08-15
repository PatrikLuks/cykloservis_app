#!/usr/bin/env bash
set -euo pipefail

# Local E2E helper: spustí backend+frontend s ENABLE_TEST_UTILS=1 a následně Playwright testy.
# Použití:
#   bash scripts/e2e-local.sh
# Volitelné proměnné:
#   API_PORT (default 5001)
#   FRONTEND_PORT (default 8080)

API_PORT=${API_PORT:-5001}
FRONTEND_PORT=${FRONTEND_PORT:-8080}

export ENABLE_TEST_UTILS=1

# Start stack (background)
(ENABLE_TEST_UTILS=1 docker compose up -d --build)

cleanup() {
  echo "\n[cleanup] Stopping docker compose..." >&2
  docker compose down -v || true
}
trap cleanup EXIT INT TERM

echo "Čekám na backend (${API_PORT})..." >&2
for i in {1..40}; do
  if curl -fsS "http://localhost:${API_PORT}/api/health/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ $i -eq 40 ]; then
    echo "Backend se nespustil včas" >&2
    exit 1
  fi
done

echo "Čekám na frontend (${FRONTEND_PORT})..." >&2
for i in {1..60}; do
  if curl -fsS "http://localhost:${FRONTEND_PORT}/" >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ $i -eq 60 ]; then
    echo "Frontend se nespustil včas" >&2
    exit 1
  fi
done

echo "Spouštím Playwright testy..." >&2
(cd frontend && npm run test:e2e)

echo "Hotovo." >&2
