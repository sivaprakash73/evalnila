import mysql from 'mysql2/promise';

let pool;

const databaseConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'ecom_dashboard'
};

process.env.MYSQL_HOST = databaseConfig.host;
process.env.MYSQL_PORT = String(databaseConfig.port);
process.env.MYSQL_USER = databaseConfig.user;
process.env.MYSQL_DATABASE = databaseConfig.database;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...databaseConfig,
      waitForConnections: true,
      connectionLimit: 10
    });
  }

  return pool;
}

export async function query(sql, values = []) {
  const [rows] = await getPool().execute(sql, values);
  return rows;
}
