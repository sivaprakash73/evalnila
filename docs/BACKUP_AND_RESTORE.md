# Evalnila Database Backup And Restore

This guide explains how to back up and restore the Evalnila MySQL database safely.

## Database name

Default database:

```text
ecom_dashboard
```

Update the commands if your live database name is different.

## 1. Create a full SQL backup

From the server:

```bash
mysqldump -u root -p ecom_dashboard > evalnila_backup.sql
```

If you use a dedicated app user with backup privileges:

```bash
mysqldump -u evalnila_app -p ecom_dashboard > evalnila_backup.sql
```

## 2. Create a timestamped backup

Recommended format:

```bash
mysqldump -u root -p ecom_dashboard > evalnila_$(date +%F_%H-%M-%S).sql
```

Example output:

```text
evalnila_2026-04-24_17-10-00.sql
```

## 3. Compress the backup

```bash
gzip evalnila_backup.sql
```

This creates:

```text
evalnila_backup.sql.gz
```

## 4. Restore the database

Create the database if needed:

```sql
CREATE DATABASE IF NOT EXISTS ecom_dashboard;
```

Restore from SQL:

```bash
mysql -u root -p ecom_dashboard < evalnila_backup.sql
```

Restore from gzip:

```bash
gunzip < evalnila_backup.sql.gz | mysql -u root -p ecom_dashboard
```

## 5. Backup before schema changes

Always take a backup before:

- changing production schema
- reseeding live data
- switching payment or order logic
- upgrading MySQL major version

## 6. Safe backup checklist

1. Confirm the backup file is created and non-empty.
2. Copy the backup to a second location.
3. Keep at least one off-server backup.
4. Test restore on a staging database before relying on the backup.

## 7. Recommended backup locations

- local server disk
- attached block storage
- secure cloud bucket
- separate disaster recovery machine

## 8. Quick production pattern

Nightly backup example:

```bash
mysqldump -u root -pYOUR_PASSWORD ecom_dashboard | gzip > /var/backups/evalnila/ecom_dashboard_$(date +%F).sql.gz
```

Keep credentials out of shell history when possible. Prefer a secure MySQL client config or backup user with restricted permissions.
