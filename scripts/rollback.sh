#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/evalnila}"
APP_NAME="${APP_NAME:-evalnila-dashboard}"
TARGET_REF="${1:-}"

if [ -z "${TARGET_REF}" ]; then
  echo "Usage: bash scripts/rollback.sh <git-ref>"
  echo "Example: bash scripts/rollback.sh HEAD~1"
  exit 1
fi

echo "Rolling back ${APP_NAME} in ${APP_DIR} to ${TARGET_REF}"

if [ ! -d "${APP_DIR}" ]; then
  echo "Application directory not found: ${APP_DIR}"
  exit 1
fi

cd "${APP_DIR}"

if [ ! -d ".git" ]; then
  echo "No git repository found in ${APP_DIR}"
  exit 1
fi

git fetch --all
git checkout "${TARGET_REF}"

echo "Installing dependencies for rollback target"
npm install

echo "Building rollback target"
npm run build

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart "${APP_NAME}" || pm2 start ecosystem.config.js
  pm2 save
else
  echo "PM2 not found. Restart the service manually."
fi

echo "Rollback completed"
