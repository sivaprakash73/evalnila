#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"

echo "Checking ${APP_URL}/api/health"
curl --fail --silent --show-error "${APP_URL}/api/health"
echo

echo "Checking ${APP_URL}/"
curl --fail --silent --show-error -I "${APP_URL}/"
echo

echo "Checking ${APP_URL}/store"
curl --fail --silent --show-error -I "${APP_URL}/store"
echo

echo "Health checks passed"
