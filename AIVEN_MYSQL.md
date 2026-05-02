# Aiven MySQL Setup

Use Aiven's free MySQL plan as the managed database for this project.

## 1. Create the service

Create an Aiven for MySQL service from the Aiven console. The free plan is enough for a small test deployment:

- 1 dedicated VM
- 1 CPU
- 1 GB RAM
- 1 GB storage

## 2. Configure the app

Copy `.env.example` to `.env.local`, then replace the MySQL values with the Aiven connection details:

```env
MYSQL_HOST=your-aiven-host.aivencloud.com
MYSQL_PORT=12345
MYSQL_DATABASE=ecom_dashboard
MYSQL_USER=avnadmin
MYSQL_PASSWORD=your_aiven_password
MYSQL_SSL_CA_PATH=./certs/aiven-ca.pem
```

Download the Aiven CA certificate from the service overview and save it at the path used by `MYSQL_SSL_CA_PATH`.

For Vercel or another hosted runtime, use `MYSQL_SSL_CA_BASE64` instead of a local certificate path. Generate it from the downloaded certificate:

```bash
powershell -Command "[Convert]::ToBase64String([IO.File]::ReadAllBytes('certs/aiven-ca.pem'))"
```

If Aiven does not let your service user create a new database, set `MYSQL_DATABASE` to the existing Aiven database name shown in the service overview. The seed command adapts the schema and seed SQL to the configured database.

## 3. Create tables and seed data

```bash
npm run db:seed
```

This applies `mysql/schema.sql`, all files in `mysql/migrations`, and `mysql/seed.sql`.

## 4. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.
