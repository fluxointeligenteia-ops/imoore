#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

ROLLBACK_COMMIT="${1:-}"

if [ -z "$ROLLBACK_COMMIT" ] && [ -f .deploy/last-successful-commit.txt ]; then
  ROLLBACK_COMMIT="$(cat .deploy/last-successful-commit.txt)"
fi

if [ -z "$ROLLBACK_COMMIT" ]; then
  echo "Informe um commit para rollback ou mantenha .deploy/last-successful-commit.txt."
  echo "Uso: ./scripts/rollback.sh <commit>"
  exit 1
fi

git fetch --prune origin
git checkout "$ROLLBACK_COMMIT"

docker compose build
docker compose up -d --remove-orphans

docker compose ps
