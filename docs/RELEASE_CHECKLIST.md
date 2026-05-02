# Evalnila Release Checklist

Use this checklist before each production release.

## Before deploy

1. Confirm code is merged to the release branch.
2. Review environment variable changes.
3. Verify database changes are backed up.
4. Confirm Razorpay config changes if checkout logic changed.
5. Run `npm install`.
6. Run `npm run build` on the target environment.

## During deploy

1. Run [scripts/deploy.sh](/D:/Ecom/scripts/deploy.sh:1).
2. Run [scripts/health-check.sh](/D:/Ecom/scripts/health-check.sh:1).
3. Check PM2 or `systemd` status.
4. Check Nginx status.

## After deploy

1. Verify storefront homepage.
2. Verify admin login.
3. Verify product catalog.
4. Verify customer login/register.
5. Verify checkout with Razorpay.
6. Verify webhook delivery.
7. Verify order tracking.

## If something fails

1. Inspect PM2 logs or system logs.
2. Check `.env.local`.
3. Check database connectivity.
4. Check Razorpay webhook and key configuration.
5. Run [scripts/rollback.sh](/D:/Ecom/scripts/rollback.sh:1) if necessary.
