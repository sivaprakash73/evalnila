const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function loadEnv(filePath) {
  const env = {};

  if (!fs.existsSync(filePath)) {
    return env;
  }

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1).replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }

  return env;
}

function escapeIdentifier(identifier) {
  return `\`${String(identifier).replace(/`/g, '``')}\``;
}

function prepareSql(sql, databaseName) {
  return sql
    .replace(/CREATE DATABASE IF NOT EXISTS\s+`?ecom_dashboard`?\s*;/i, `CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(databaseName)};`)
    .replace(/USE\s+`?ecom_dashboard`?\s*;/gi, `USE ${escapeIdentifier(databaseName)};`);
}

function getSslConfig(env) {
  if (env.MYSQL_SSL_CA_PATH) {
    return {
      ca: fs.readFileSync(path.resolve(env.MYSQL_SSL_CA_PATH), 'utf8'),
      rejectUnauthorized: env.MYSQL_SSL_REJECT_UNAUTHORIZED !== 'false'
    };
  }

  if (env.MYSQL_SSL_CA_BASE64) {
    return {
      ca: Buffer.from(env.MYSQL_SSL_CA_BASE64, 'base64').toString('utf8'),
      rejectUnauthorized: env.MYSQL_SSL_REJECT_UNAUTHORIZED !== 'false'
    };
  }

  if (env.MYSQL_SSL === 'true') {
    return {
      rejectUnauthorized: env.MYSQL_SSL_REJECT_UNAUTHORIZED !== 'false'
    };
  }

  return undefined;
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const env = { ...process.env, ...loadEnv(path.join(root, '.env.local')) };

  for (const key of ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE']) {
    if (!env[key]) {
      throw new Error(`Missing ${key}. Configure .env.local before applying the seed.`);
    }
  }

  const connection = await mysql.createConnection({
    host: env.MYSQL_HOST,
    port: Number(env.MYSQL_PORT || 3306),
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    ssl: getSslConfig(env),
    multipleStatements: true
  });

  try {
    await connection.query(prepareSql(fs.readFileSync(path.join(root, 'mysql', 'schema.sql'), 'utf8'), env.MYSQL_DATABASE));

    const migrationsPath = path.join(root, 'mysql', 'migrations');
    const migrations = fs.existsSync(migrationsPath)
      ? fs.readdirSync(migrationsPath).filter((file) => file.endsWith('.sql')).sort()
      : [];

    for (const migration of migrations) {
      const migrationSql = prepareSql(fs.readFileSync(path.join(migrationsPath, migration), 'utf8'), env.MYSQL_DATABASE);

      try {
        await connection.query(migrationSql);
      } catch (error) {
        if (!String(error.message).includes('Duplicate column name')) {
          throw error;
        }
      }
    }

    await connection.query(prepareSql(fs.readFileSync(path.join(root, 'mysql', 'seed.sql'), 'utf8'), env.MYSQL_DATABASE));

    const [products] = await connection.query(`
      SELECT
        c.slug AS category,
        p.name,
        p.sku,
        p.mrp,
        COALESCE(p.special_price, p.price) AS special_price,
        p.stock,
        p.availability_type,
        p.ready_stock_dispatch_days,
        p.make_order_dispatch_days
      FROM ${escapeIdentifier(env.MYSQL_DATABASE)}.products p
      INNER JOIN ${escapeIdentifier(env.MYSQL_DATABASE)}.categories c ON c.id = p.category_id
      ORDER BY p.id
    `);

    console.table(products);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
