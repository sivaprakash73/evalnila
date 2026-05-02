import {
  dashboardSummary,
  monthlySales,
  orderStatus,
  recentOrders,
  topProducts
} from '@/lib/dashboard-data';
import { formatRupees } from '@/lib/currency';

export async function buildDashboardResponse(runQuery) {
  if (!process.env.MYSQL_HOST) {
    return {
      source: 'mock',
      summary: dashboardSummary,
      monthlySales,
      orderStatus,
      recentOrders,
      topProducts
    };
  }

  const [summaryRows, statusRows, orderRows, productRows, monthlyRows] = await Promise.all([
    runQuery(`
      SELECT
        (SELECT IFNULL(SUM(total_amount), 0) FROM orders) AS grossRevenue,
        (SELECT COUNT(*) FROM orders WHERE DATE(order_date) = CURDATE()) AS ordersToday,
        (SELECT COUNT(*) FROM products WHERE status = 'active') AS activeProducts,
        (
          SELECT ROUND(
            IFNULL(
              (
                COUNT(DISTINCT CASE WHEN order_count > 1 THEN customer_id END) /
                NULLIF(COUNT(DISTINCT customer_id), 0)
              ) * 100,
              0
            ),
            0
          )
          FROM (
            SELECT customer_id, COUNT(*) AS order_count
            FROM orders
            GROUP BY customer_id
          ) customer_orders
        ) AS returningCustomers
    `),
    runQuery(`
      SELECT status, COUNT(*) AS total
      FROM orders
      GROUP BY status
      ORDER BY total DESC
    `),
    runQuery(`
      SELECT
        o.order_number AS orderNumber,
        CONCAT(c.first_name, ' ', c.last_name) AS customer,
        o.total_amount AS amount,
        o.status
      FROM orders o
      INNER JOIN customers c ON c.id = o.customer_id
      ORDER BY o.order_date DESC
      LIMIT 5
    `),
    runQuery(`
      SELECT name, sku, revenue
      FROM products
      ORDER BY revenue DESC
      LIMIT 4
    `),
    runQuery(`
      SELECT DATE_FORMAT(MIN(order_date), '%b') AS label, ROUND(SUM(total_amount) / 1000, 0) AS value
      FROM orders
      GROUP BY YEAR(order_date), MONTH(order_date)
      ORDER BY YEAR(order_date), MONTH(order_date)
      LIMIT 8
    `)
  ]);

  const summary = [
    {
      label: 'Gross Revenue',
      value: formatRupees(summaryRows[0].grossRevenue),
      delta: 'Live',
      tone: 'sun'
    },
    {
      label: 'Orders Today',
      value: String(summaryRows[0].ordersToday),
      delta: 'Live',
      tone: 'sea'
    },
    {
      label: 'Active Products',
      value: String(summaryRows[0].activeProducts),
      delta: 'Live',
      tone: 'mint'
    },
    {
      label: 'Returning Customers',
      value: `${summaryRows[0].returningCustomers}%`,
      delta: 'Live',
      tone: 'berry'
    }
  ];

  const totalStatusCount = statusRows.reduce((acc, row) => acc + Number(row.total), 0) || 1;

  return {
    source: 'mysql',
    summary,
    orderStatus: statusRows.map((row) => ({
      label: row.status,
      value: Math.round((Number(row.total) / totalStatusCount) * 100),
      tone: mapTone(row.status)
    })),
    recentOrders: orderRows,
    topProducts: productRows,
    monthlySales: monthlyRows
  };
}

function mapTone(status) {
  const lookup = {
    pending: 'warning',
    packed: 'info',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'danger'
  };

  return lookup[String(status).toLowerCase()] || 'secondary';
}
