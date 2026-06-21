#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Arquivo .env não encontrado. Copie .env.example para .env e preencha os valores reais."
  exit 1
fi

mkdir -p .deploy

CURRENT_COMMIT="$(git rev-parse HEAD)"
PREVIOUS_COMMIT=""
if [ -f .deploy/current-commit.txt ]; then
  PREVIOUS_COMMIT="$(cat .deploy/current-commit.txt)"
fi

docker compose build --pull
docker compose up -d --remove-orphans

docker compose ps
docker compose exec -T imoore-app node -e "require('http').get('http://127.0.0.1:3001/', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

if [ -n "$PREVIOUS_COMMIT" ] && [ "$PREVIOUS_COMMIT" != "$CURRENT_COMMIT" ]; then
  echo "$PREVIOUS_COMMIT" > .deploy/last-successful-commit.txt
fi
echo "$CURRENT_COMMIT" > .deploy/current-commit.txt
