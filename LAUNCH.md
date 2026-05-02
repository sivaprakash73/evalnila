# Evalnila Production Launch

Use this checklist to move Evalnila to a live VPS.

## 1. Upload project

Place the project in:

```bash
/var/www/evalnila
```

## 2. Create production environment

```bash
cp PRODUCTION_ENV.example .env.local
nano .env.local
```

Set real values for:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `JWT_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

## 3. Create MySQL database and user

```bash
mysql -u root -p
```

```sql
CREATE DATABASE ecom_dashboard;
CREATE USER 'evalnila_app'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON ecom_dashboard.* TO 'evalnila_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4. Import schema and seed

```bash
mysql -u evalnila_app -p ecom_dashboard < mysql/schema.sql
mysql -u evalnila_app -p ecom_dashboard < mysql/seed.sql
```

## 5. Apply live payment order index

If the database already existed before the latest payment flow fix, run:

```bash
mysql -u evalnila_app -p
```

```sql
USE ecom_dashboard;
ALTER TABLE orders
ADD UNIQUE KEY uq_orders_payment_gateway_order_id (payment_gateway_order_id);
```

## 6. Install dependencies and build

```bash
npm install
npm run build
```

## 7. Start application

### PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

### Optional restart

```bash
pm2 restart evalnila-dashboard
```

## 8. Configure Nginx

```bash
sudo cp config/nginx/evalnila.conf /etc/nginx/sites-available/evalnila
sudo nano /etc/nginx/sites-available/evalnila
```

Update the domain name, then:

```bash
sudo ln -s /etc/nginx/sites-available/evalnila /etc/nginx/sites-enabled/evalnila
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Enable SSL

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 10. Configure Razorpay live webhook

Set webhook URL in Razorpay dashboard:

```text
https://your-domain.com/api/store/payments/razorpay-webhook
```

Make sure:

- live keys are being used
- webhook secret matches `.env.local`

## 11. Run health checks

```bash
APP_URL=https://your-domain.com bash scripts/health-check.sh
```

## 12. Verify production manually

Check:

1. home page `/`
2. shop `/store`
3. admin login `/login`
4. customer account flow
5. checkout flow
6. Razorpay payment success
7. order tracking page
8. admin order listing
9. invoice page
10. webhook-driven payment update

## 13. Useful commands

### PM2

```bash
pm2 logs evalnila-dashboard
pm2 restart evalnila-dashboard
pm2 status
```

### Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo tail -n 100 /var/log/nginx/error.log
```

### System logs

```bash
journalctl -u evalnila -n 100 --no-pager
```

## 14. Do not go live until

- build passes
- health check passes
- HTTPS works
- DB is connected
- Razorpay live keys are configured
- webhook works
- one end-to-end payment is verified
