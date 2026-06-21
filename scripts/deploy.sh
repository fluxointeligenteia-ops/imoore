#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/imoore}"
REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-main}"

if [ -z "$REPO_URL" ]; then
  echo "Defina REPO_URL antes de executar. Ex: REPO_URL=git@github.com:org/imoore.git ./scripts/deploy.sh"
  exit 1
fi

if [ ! -d "$APP_DIR/.git" ]; then
  mkdir -p "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Arquivo .env criado em $APP_DIR/.env. Preencha os valores reais antes de continuar."
  exit 1
fi

git fetch --prune origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

chmod +x scripts/*.sh
./scripts/update.sh
