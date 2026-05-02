#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/evalnila}"
NODE_MAJOR="${NODE_MAJOR:-20}"

echo "Starting Ubuntu bootstrap for Evalnila"

sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git nginx mysql-server ufw

curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

sudo mkdir -p "${APP_DIR}"
sudo chown -R "$USER:$USER" "${APP_DIR}"

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

echo
echo "Bootstrap completed"
echo "Next steps:"
echo "1. Copy the project into ${APP_DIR}"
echo "2. Create .env.local from PRODUCTION_ENV.example"
echo "3. Create MySQL database and user"
echo "4. Run npm install && npm run build"
echo "5. Start with PM2 or systemd"
