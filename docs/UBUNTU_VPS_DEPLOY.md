# Evalnila Ubuntu VPS Deployment

This guide walks through deploying Evalnila on an Ubuntu VPS with Node.js, MySQL, PM2, Nginx, and SSL.

## 1. Recommended server

Minimum starter recommendation:

- Ubuntu 22.04 LTS or newer
- 2 vCPU
- 4 GB RAM
- 40 GB SSD

## 2. Install base packages

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git nginx mysql-server
```

## 3. Install Node.js LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
node -v
npm -v
```

## 4. Install PM2

```bash
sudo npm install -g pm2
```

## 5. Upload or clone the project

Example:

```bash
cd /var/www
sudo mkdir -p /var/www/evalnila
sudo chown -R $USER:$USER /var/www/evalnila
cd /var/www/evalnila
```

Copy project files there or clone your repository.

## 6. Create production environment file

Use the template:

- [PRODUCTION_ENV.example](/D:/Ecom/PRODUCTION_ENV.example:1)

Example:

```bash
cp PRODUCTION_ENV.example .env.local
```

Then edit:

```bash
nano .env.local
```

Set real values for:

- MySQL credentials
- JWT secret
- Razorpay live keys
- Razorpay webhook secret

## 7. Set up MySQL

Log in:

```bash
sudo mysql
```

Create database and app user:

```sql
CREATE DATABASE ecom_dashboard;
CREATE USER 'evalnila_app'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON ecom_dashboard.* TO 'evalnila_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Import schema and seed:

```bash
mysql -u evalnila_app -p ecom_dashboard < mysql/schema.sql
mysql -u evalnila_app -p ecom_dashboard < mysql/seed.sql
```

## 8. Install dependencies and build

```bash
npm install
npm run build
```

## 9. Start the app with PM2

PM2 config:

- [ecosystem.config.js](/D:/Ecom/ecosystem.config.js:1)

Start:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Useful checks:

```bash
pm2 status
pm2 logs evalnila-dashboard
```

## 10. Configure Nginx

Repo config:

- [config/nginx/evalnila.conf](/D:/Ecom/config/nginx/evalnila.conf:1)

Copy it:

```bash
sudo cp config/nginx/evalnila.conf /etc/nginx/sites-available/evalnila
```

Edit the domain:

```bash
sudo nano /etc/nginx/sites-available/evalnila
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/evalnila /etc/nginx/sites-enabled/evalnila
sudo nginx -t
sudo systemctl reload nginx
```

## 11. Add SSL with Let’s Encrypt

Install certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Issue certificate:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 12. Configure Razorpay live webhook

Webhook URL:

```text
https://your-domain.com/api/store/payments/razorpay-webhook
```

Make sure:

- HTTPS is active
- `RAZORPAY_WEBHOOK_SECRET` matches the Razorpay dashboard secret
- live keys are used, not test keys

## 13. Open firewall

If using UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 14. Post-deploy checks

Verify:

```bash
curl http://127.0.0.1:3000/api/health
curl https://your-domain.com/api/health
```

Then test:

1. storefront homepage
2. admin login
3. product list from MySQL
4. Razorpay checkout
5. webhook delivery
6. order tracking

## 15. Update deployment

For a new release:

```bash
cd /var/www/evalnila
git pull
npm install
npm run build
pm2 restart evalnila-dashboard
```

## 16. Rollback safety

Before deploy:

1. take a database backup
2. keep previous `.env.local`
3. keep the previous application revision available

Backup guide:

- [docs/BACKUP_AND_RESTORE.md](/D:/Ecom/docs/BACKUP_AND_RESTORE.md:1)
