import { customersPageRows } from '@/lib/dashboard-data';

export async function getCustomers(runQuery) {
  if (!process.env.MYSQL_HOST) {
    return customersPageRows;
  }

  return runQuery(`
    SELECT
      c.id,
      CONCAT(c.first_name, ' ', c.last_name) AS name,
      c.email,
      c.phone,
      CONCAT(c.city, ', ', c.country) AS location,
      COUNT(o.id) AS orders,
      IFNULL(SUM(o.total_amount), 0) AS lifetimeValue
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.city, c.country
    ORDER BY lifetimeValue DESC
  `);
}

export async function getCustomerById(runQuery, id) {
  if (!process.env.MYSQL_HOST) {
    return customersPageRows.find((item, index) => String(index + 1) === String(id)) || null;
  }

  const rows = await runQuery(
    `
      SELECT
        c.id,
        CONCAT(c.first_name, ' ', c.last_name) AS name,
        c.email,
        c.phone,
        CONCAT(c.city, ', ', c.country) AS location,
        COUNT(o.id) AS orders,
        IFNULL(SUM(o.total_amount), 0) AS lifetimeValue
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.id = ?
      GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.city, c.country
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows[0] || null;
}
