import { monthlySales, ordersPageRows, topProducts } from '@/lib/dashboard-data';

function toNumber(value) {
  return Number(value || 0);
}

export async function getSalesReport(runQuery) {
  if (!process.env.MYSQL_HOST) {
    const totalRevenue = ordersPageRows.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const paidOrders = ordersPageRows.filter((order) => order.paymentStatus === 'Paid').length;

    return {
      summary: {
        totalRevenue,
        totalOrders: ordersPageRows.length,
        paidOrders,
        averageOrderValue: ordersPageRows.length ? totalRevenue / ordersPageRows.length : 0
      },
      monthlySales,
      topProducts,
      recentOrders: ordersPageRows
    };
  }

  const summaryRows = await runQuery(`
    SELECT
      COALESCE(SUM(total_amount), 0) AS totalRevenue,
      COUNT(*) AS totalOrders,
      SUM(payment_status = 'Paid') AS paidOrders,
      COALESCE(AVG(total_amount), 0) AS averageOrderValue
    FROM orders
  `);

  const monthlyRows = await runQuery(`
    SELECT
      DATE_FORMAT(order_date, '%b') AS label,
      ROUND(SUM(total_amount) / 1000, 1) AS value,
      MIN(order_date) AS sortDate
    FROM orders
    WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 8 MONTH)
    GROUP BY YEAR(order_date), MONTH(order_date), DATE_FORMAT(order_date, '%b')
    ORDER BY sortDate ASC
  `);

  const productRows = await runQuery(`
    SELECT
      p.name,
      p.sku,
      COALESCE(SUM(oi.line_total), 0) AS revenue
    FROM order_items oi
    INNER JOIN products p ON p.id = oi.product_id
    GROUP BY p.id, p.name, p.sku
    ORDER BY revenue DESC
    LIMIT 8
  `);

  const recentRows = await runQuery(`
    SELECT
      o.id,
      o.order_number AS orderNumber,
      CONCAT(c.first_name, ' ', c.last_name) AS customer,
      DATE_FORMAT(o.order_date, '%Y-%m-%d') AS orderDate,
      o.payment_status AS paymentStatus,
      o.status,
      o.total_amount AS amount
    FROM orders o
    INNER JOIN customers c ON c.id = o.customer_id
    ORDER BY o.order_date DESC
    LIMIT 8
  `);

  return {
    summary: {
      totalRevenue: toNumber(summaryRows[0]?.totalRevenue),
      totalOrders: toNumber(summaryRows[0]?.totalOrders),
      paidOrders: toNumber(summaryRows[0]?.paidOrders),
      averageOrderValue: toNumber(summaryRows[0]?.averageOrderValue)
    },
    monthlySales: monthlyRows.length
      ? monthlyRows.map((row) => ({
          label: row.label,
          value: toNumber(row.value)
        }))
      : monthlySales,
    topProducts: productRows.map((product) => ({
      name: product.name,
      sku: product.sku,
      revenue: toNumber(product.revenue)
    })),
    recentOrders: recentRows.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer,
      orderDate: order.orderDate,
      paymentStatus: order.paymentStatus,
      status: order.status,
      amount: toNumber(order.amount)
    }))
  };
}
