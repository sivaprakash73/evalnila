#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/evalnila}"
APP_NAME="${APP_NAME:-evalnila-dashboard}"
BRANCH="${BRANCH:-main}"

echo "Deploying ${APP_NAME} from ${APP_DIR} on branch ${BRANCH}"

if [ ! -d "${APP_DIR}" ]; then
  echo "Application directory not found: ${APP_DIR}"
  exit 1
fi

cd "${APP_DIR}"

if [ -d ".git" ]; then
  echo "Fetching latest code"
  git fetch origin
  git checkout "${BRANCH}"
  git pull origin "${BRANCH}"
fi

echo "Installing dependencies"
npm install

echo "Building Next.js app"
npm run build

if command -v pm2 >/dev/null 2>&1; then
  echo "Restarting PM2 process"
  pm2 restart "${APP_NAME}" || pm2 start ecosystem.config.js
  pm2 save
else
  echo "PM2 not found. Start the app manually or use systemd."
fi

echo "Deployment completed"
