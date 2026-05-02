# Evalnila Setup And Go-Live Guide

This document explains how to run the Evalnila project locally, connect MySQL, configure Razorpay, and move the project to a live server.

## Stack

- Next.js pages router
- Node.js API routes
- MySQL 8
- Bootstrap 5
- JWT auth for admin and customer areas
- Razorpay Standard Checkout + webhook verification

## 1. Project prerequisites

Install these first:

- Node.js 18 or newer
- npm 9 or newer
- MySQL 8.x

Verify:

```bash
node -v
npm -v
mysql --version
```

## 2. Install project dependencies

From the project root:

```bash
npm install
```

## 3. Configure environment variables

Create `.env.local` from the example file:

```bash
copy .env.example .env.local
```

Current environment variables used by the project:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=ecom_dashboard
MYSQL_USER=root
MYSQL_PASSWORD=your_password
JWT_SECRET=replace_with_a_long_random_secret
ADMIN_EMAIL=admin@evalnila.com
ADMIN_PASSWORD=admin123
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

Notes:

- If `MYSQL_HOST` is missing, some admin/storefront pages fall back to mock data.
- For real orders, customers, products, and Razorpay checkout, MySQL must be configured.
- `JWT_SECRET` should be a long random value in production.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are only fallback credentials when MySQL admin records are not being used.

## 4. Connect MySQL

The database connection is defined in [lib/db.js](/D:/Ecom/lib/db.js:1).

The app reads:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

Example local database config:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=ecom_dashboard
MYSQL_USER=root
MYSQL_PASSWORD=StrongPassword123
```

## 5. Create database schema and seed data

Open MySQL and run:

```sql
CREATE DATABASE IF NOT EXISTS ecom_dashboard;
USE ecom_dashboard;
SOURCE mysql/schema.sql;
SOURCE mysql/seed.sql;
```

These files live here:

- [mysql/schema.sql](/D:/Ecom/mysql/schema.sql:1)
- [mysql/seed.sql](/D:/Ecom/mysql/seed.sql:1)

The seed creates:

- categories
- products
- customers
- sample orders
- default admin user

Default seeded admin:

- email: `admin@evalnila.com`
- password: `admin123`

## 6. Run locally

Start the development server:

```bash
npm run dev
```

Main URLs:

- `http://localhost:3000/`
- `http://localhost:3000/store`
- `http://localhost:3000/login`
- `http://localhost:3000/dashboard`

## 7. How Razorpay is connected

Razorpay server logic is implemented in [lib/server/razorpay-service.js](/D:/Ecom/lib/server/razorpay-service.js:1).

Checkout and verification routes:

- [pages/api/store/payments/razorpay-order.js](/D:/Ecom/pages/api/store/payments/razorpay-order.js:1)
- [pages/api/store/payments/razorpay-verify.js](/D:/Ecom/pages/api/store/payments/razorpay-verify.js:1)
- [pages/api/store/payments/razorpay-webhook.js](/D:/Ecom/pages/api/store/payments/razorpay-webhook.js:1)

Checkout page:

- [pages/checkout.js](/D:/Ecom/pages/checkout.js:1)

Order persistence:

- [lib/server/orders-service.js](/D:/Ecom/lib/server/orders-service.js:1)

## 8. Razorpay test setup

In Razorpay dashboard, create or copy:

- `Key ID`
- `Key Secret`

Add them to `.env.local`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
RAZORPAY_WEBHOOK_SECRET=choose_a_secret_for_webhooks
```

What happens in this project:

1. Checkout creates a Razorpay order on the server.
2. The storefront opens Razorpay Standard Checkout.
3. Razorpay returns payment data to the frontend.
4. The backend verifies the signature.
5. The local order is created only after verification.
6. Webhooks update payment state again from the server side.

## 9. Razorpay webhook setup

Configure this webhook URL in Razorpay:

```text
https://your-domain.com/api/store/payments/razorpay-webhook
```

Use the same secret value in:

- Razorpay webhook settings
- `RAZORPAY_WEBHOOK_SECRET`

Recommended webhook events for this project:

- `payment.authorized`
- `payment.captured`
- `payment.failed`
- `order.paid`

Important:

- Your live server must be on HTTPS.
- Webhooks will not work reliably on a local private URL unless you expose it publicly with a tunnel.

## 10. Move from test to live Razorpay

When you are ready for production:

1. Complete KYC and account approval inside Razorpay.
2. Switch to live mode in the Razorpay dashboard.
3. Replace test keys with live keys in server environment variables.
4. Update the live webhook URL.
5. Perform one real payment verification before launch.

Do not mix:

- test keys with live domain
- live keys with test webhook secret
- test dashboard event settings with live mode

## 11. Build for production

Install dependencies if needed:

```bash
npm install
```

Build:

```bash
npm run build
```

Start production server:

```bash
npm run start
```

If the build fails on a restricted shell environment, that does not automatically mean the code is broken. In my sandbox, `next build` was blocked by process spawning permissions (`spawn EPERM`), which is an environment restriction issue rather than a confirmed application bug.

## 12. Deploy with PM2

PM2 config is already included in [ecosystem.config.js](/D:/Ecom/ecosystem.config.js:1).

Build and start:

```bash
npm install
npm run build
npx pm2 start ecosystem.config.js
```

Useful PM2 commands:

```bash
npx pm2 status
npx pm2 logs evalnila-dashboard
npx pm2 restart evalnila-dashboard
npx pm2 save
```

## 13. Deploy with Docker

Docker config:

- [Dockerfile](/D:/Ecom/Dockerfile:1)
- [docker-compose.yml](/D:/Ecom/docker-compose.yml:1)

Run:

```bash
docker compose up --build -d
```

Current compose setup starts:

- app on port `3000`
- mysql on port `3306`

Current compose defaults are starter values only. Change before live use:

- MySQL passwords
- JWT secret
- admin credentials
- Razorpay keys

## 14. Recommended production server setup

Recommended stack:

1. Ubuntu server or equivalent Linux VM
2. Node.js LTS
3. MySQL 8
4. Nginx reverse proxy
5. SSL via Let’s Encrypt
6. PM2 or Docker for process management

Recommended live architecture:

- Nginx on ports `80` and `443`
- Next.js app on internal port `3000`
- MySQL not exposed publicly if avoidable

## 15. Nginx reverse proxy example

```nginx
server {
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

After Nginx is working, install SSL:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 16. Production environment recommendations

Use strong production values:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=ecom_dashboard
MYSQL_USER=evalnila_app
MYSQL_PASSWORD=use_a_long_random_password
JWT_SECRET=use_a_long_random_secret_at_least_32_chars
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=live_secret_here
RAZORPAY_WEBHOOK_SECRET=live_webhook_secret_here
```

Also recommended:

- create a separate MySQL app user instead of using `root`
- restrict MySQL network access to localhost or private network only
- rotate secrets if they were ever stored in public repos

## 17. Admin password hardening

For production admin users, generate stronger hashes:

```bash
npm run hash:password -- your_password_here
```

Script:

- [scripts/hash-password.js](/D:/Ecom/scripts/hash-password.js:1)

Store the generated `scrypt$...` value in `admin_users.password_hash`.

## 18. What to test before launch

Minimum go-live test checklist:

1. Admin login works.
2. Product list loads from MySQL, not mock data.
3. New product creation works.
4. Customer registration/login works.
5. Cart and checkout work.
6. Razorpay test payment succeeds.
7. Razorpay webhook updates payment status.
8. Order tracking page shows created orders.
9. Invoice page loads.
10. HTTPS is active on the live domain.

## 19. Go-live checklist

Before switching traffic to the live site:

1. Replace all starter secrets and passwords.
2. Replace all test Razorpay keys with live keys.
3. Confirm webhook URL uses the live domain.
4. Back up the database after initial setup.
5. Disable public MySQL exposure if not needed.
6. Confirm `npm run build` passes on the target server.
7. Verify `/api/health` returns successfully.
8. Place one real low-value payment and verify the order flow.
9. Save PM2 process list or container restart policy.
10. Enable logs and monitoring.

## 20. Files most relevant to operations

- [README.md](/D:/Ecom/README.md:1)
- [\.env.example](/D:/Ecom/.env.example:1)
- [lib/db.js](/D:/Ecom/lib/db.js:1)
- [lib/server/orders-service.js](/D:/Ecom/lib/server/orders-service.js:1)
- [lib/server/razorpay-service.js](/D:/Ecom/lib/server/razorpay-service.js:1)
- [pages/checkout.js](/D:/Ecom/pages/checkout.js:1)
- [pages/api/store/payments/razorpay-order.js](/D:/Ecom/pages/api/store/payments/razorpay-order.js:1)
- [pages/api/store/payments/razorpay-verify.js](/D:/Ecom/pages/api/store/payments/razorpay-verify.js:1)
- [pages/api/store/payments/razorpay-webhook.js](/D:/Ecom/pages/api/store/payments/razorpay-webhook.js:1)
- [docker-compose.yml](/D:/Ecom/docker-compose.yml:1)
- [ecosystem.config.js](/D:/Ecom/ecosystem.config.js:1)
