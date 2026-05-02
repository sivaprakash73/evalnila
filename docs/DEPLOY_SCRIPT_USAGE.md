# Evalnila Deploy Script Usage

This document explains how to use the deployment scripts included in the repository.

## Scripts

- [scripts/bootstrap-ubuntu.sh](/D:/Ecom/scripts/bootstrap-ubuntu.sh:1)
- [scripts/deploy.sh](/D:/Ecom/scripts/deploy.sh:1)
- [scripts/rollback.sh](/D:/Ecom/scripts/rollback.sh:1)
- [scripts/health-check.sh](/D:/Ecom/scripts/health-check.sh:1)

## 1. Bootstrap a fresh Ubuntu server

Run on a new VPS:

```bash
bash scripts/bootstrap-ubuntu.sh
```

Optional overrides:

```bash
APP_DIR=/var/www/evalnila NODE_MAJOR=20 bash scripts/bootstrap-ubuntu.sh
```

## 2. Deploy the application

Run on the server after the code is present:

```bash
bash scripts/deploy.sh
```

Optional overrides:

```bash
APP_DIR=/var/www/evalnila APP_NAME=evalnila-dashboard BRANCH=main bash scripts/deploy.sh
```

## 3. Roll back to a previous git ref

Examples:

```bash
bash scripts/rollback.sh HEAD~1
bash scripts/rollback.sh a1b2c3d
bash scripts/rollback.sh v1.0.0
```

Optional overrides:

```bash
APP_DIR=/var/www/evalnila APP_NAME=evalnila-dashboard bash scripts/rollback.sh HEAD~1
```

## 4. Run health checks

Local process:

```bash
bash scripts/health-check.sh
```

Custom URL:

```bash
APP_URL=https://your-domain.com bash scripts/health-check.sh
```

## 5. Recommended order on a new server

1. `bash scripts/bootstrap-ubuntu.sh`
2. copy project files to server
3. configure `.env.local`
4. create MySQL database and import schema/seed
5. `bash scripts/deploy.sh`
6. `bash scripts/health-check.sh`

## 6. Recommended order during release

1. take database backup
2. `bash scripts/deploy.sh`
3. `bash scripts/health-check.sh`
4. verify checkout and webhook flow
5. if needed, `bash scripts/rollback.sh <git-ref>`
