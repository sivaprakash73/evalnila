import mysql from 'mysql2/promise';
import fs from 'fs';

let pool;

function getSslConfig() {
  if (process.env.MYSQL_SSL_CA_PATH) {
    return {
      ca: fs.readFileSync(process.env.MYSQL_SSL_CA_PATH, 'utf8'),
      rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== 'false'
    };
  }

  if (process.env.MYSQL_SSL_CA_BASE64) {
    return {
      ca: Buffer.from(process.env.MYSQL_SSL_CA_BASE64, 'base64').toString('utf8'),
      rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== 'false'
    };
  }

  if (process.env.MYSQL_SSL === 'true') {
    return {
      rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== 'false'
    };
  }

  return undefined;
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: getSslConfig(),
      waitForConnections: true,
      connectionLimit: 10
    });
  }

  return pool;
}

export async function query(sql, values = []) {
  if (!process.env.MYSQL_HOST) {
    throw new Error('Missing MySQL connection settings. Configure .env.local first.');
  }

  const [rows] = await getPool().execute(sql, values);
  return rows;
}
