# Evalnila Staging Environment Guide

This guide explains how to run a staging environment before pushing changes to production.

## Why staging matters

Use staging to validate:

- new UI changes
- checkout flow
- Razorpay test payments
- webhook delivery
- database migrations or seed changes

## Recommended staging setup

Use a separate environment for:

- domain
- database
- `.env.local`
- Razorpay keys
- webhook URL

Recommended staging values:

- app URL: `https://staging.your-domain.com`
- database: `ecom_dashboard_staging`
- Razorpay: test keys only

## Staging environment file

Copy:

```bash
cp PRODUCTION_ENV.example .env.local
```

Then adjust:

- use staging database credentials
- keep `NODE_ENV=production`
- use Razorpay test keys, not live keys
- use a separate webhook secret from production

## Staging database

Create a separate database:

```sql
CREATE DATABASE ecom_dashboard_staging;
```

Import schema and seed:

```bash
mysql -u evalnila_app -p ecom_dashboard_staging < mysql/schema.sql
mysql -u evalnila_app -p ecom_dashboard_staging < mysql/seed.sql
```

## Staging webhook

Configure Razorpay test webhook URL:

```text
https://staging.your-domain.com/api/store/payments/razorpay-webhook
```

Do not reuse the production webhook secret.

## What to test in staging

1. `npm run build`
2. storefront browsing
3. admin login
4. customer registration/login
5. checkout with Razorpay test payment
6. webhook updates
7. order tracking
8. invoice page

## Promotion flow

Recommended release flow:

1. develop locally
2. push to `develop` or `staging`
3. deploy to staging
4. complete QA
5. merge to `main`
6. deploy production
