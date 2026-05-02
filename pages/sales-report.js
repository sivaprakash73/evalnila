import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import TrendBars from '@/components/TrendBars';
import { formatRupees } from '@/lib/currency';
import { query } from '@/lib/db';
import { getSalesReport } from '@/lib/server/sales-report-service';
import { withPageAuth } from '@/lib/server/with-auth';

export default function SalesReportPage({ user, report }) {
  return (
    <Layout
      title="Sales Report"
      subtitle="Review revenue, paid orders, best sellers, and recent order activity."
      user={user}
    >
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <StatCard label="Total Revenue" value={formatRupees(report.summary.totalRevenue)} delta="Sales" tone="sun" />
        </div>
        <div className="col-md-3">
          <StatCard label="Total Orders" value={Number(report.summary.totalOrders || 0).toLocaleString()} delta="Orders" tone="sea" />
        </div>
        <div className="col-md-3">
          <StatCard label="Paid Orders" value={Number(report.summary.paidOrders || 0).toLocaleString()} delta="Paid" tone="mint" />
        </div>
        <div className="col-md-3">
          <StatCard label="Avg. Order" value={formatRupees(report.summary.averageOrderValue)} delta="AOV" tone="berry" />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <SectionCard title="Monthly Sales" description="Revenue movement for recent months.">
            <TrendBars data={report.monthlySales} />
          </SectionCard>
        </div>
        <div className="col-lg-5">
          <SectionCard title="Top Products" description="Best products by sales revenue.">
            <div className="table-responsive">
              <table className="table align-middle custom-table mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topProducts.map((product) => (
                    <tr key={product.sku}>
                      <td>{product.name}</td>
                      <td>{product.sku}</td>
                      <td>{formatRupees(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Recent Sales" description="Latest sales included in the report.">
        <div className="table-responsive">
          <table className="table align-middle custom-table mb-0">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {report.recentOrders.map((order) => (
                <tr key={order.id || order.orderNumber}>
                  <td className="fw-semibold">{order.orderNumber}</td>
                  <td>{order.customer}</td>
                  <td>{order.orderDate}</td>
                  <td>{order.paymentStatus}</td>
                  <td>{order.status}</td>
                  <td>{formatRupees(order.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async () => {
  const report = await getSalesReport(query);

  return {
    props: {
      report
    }
  };
});
