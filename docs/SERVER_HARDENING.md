# Evalnila Server Hardening Checklist

Use this checklist before exposing the production server publicly.

## Access and authentication

1. Disable password SSH login if you use SSH keys.
2. Disable direct root SSH login.
3. Use a non-root deploy user.
4. Rotate SSH keys when team access changes.

## Firewall

Only allow:

- `22` for SSH
- `80` for HTTP
- `443` for HTTPS

If MySQL is local-only, do not expose `3306` publicly.

## OS updates

1. Apply security updates regularly.
2. Enable unattended security upgrades if appropriate.

Example:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y unattended-upgrades
```

## MySQL security

1. Run `mysql_secure_installation`.
2. Use a dedicated application user, not `root`.
3. Restrict MySQL to localhost or private network access only.
4. Take backups before schema changes.

## Application secrets

1. Replace all starter passwords.
2. Use a long `JWT_SECRET`.
3. Use Razorpay live keys only in production.
4. Keep `.env.local` out of version control.

## Reverse proxy and TLS

1. Use Nginx as the public entry point.
2. Enable HTTPS with Let’s Encrypt.
3. Renew certificates automatically.
4. Redirect HTTP to HTTPS.

## Process management

1. Use PM2 or `systemd`.
2. Enable auto-start on reboot.
3. Keep logs accessible.

## Monitoring

Recommended minimum monitoring:

- PM2 status
- Nginx error logs
- application logs
- MySQL disk usage
- CPU and memory usage

## Payment safety

1. Verify Razorpay webhook URL is correct.
2. Verify webhook secret matches production config.
3. Test one live payment after deployment.
4. Check that order creation and payment status updates both work.

## Final pre-launch review

1. `npm run build` passes on the server.
2. `scripts/health-check.sh` passes.
3. Admin login works.
4. Checkout works.
5. Webhooks work.
6. Backups are enabled.
