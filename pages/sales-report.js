import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
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
            <DataTable
              columns={[
                { header: 'Product', accessor: 'name' },
                { header: 'SKU', accessor: 'sku' },
                {
                  header: 'Revenue',
                  accessor: 'revenue',
                  render: (product) => formatRupees(product.revenue),
                  sortValue: (product) => Number(product.revenue || 0)
                }
              ]}
              rows={report.topProducts}
              getRowKey={(product) => product.sku}
              initialPageSize={5}
            />
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Recent Sales" description="Latest sales included in the report.">
        <DataTable
          columns={[
            {
              header: 'Order',
              accessor: 'orderNumber',
              render: (order) => <span className="fw-semibold">{order.orderNumber}</span>
            },
            { header: 'Customer', accessor: 'customer' },
            { header: 'Date', accessor: 'orderDate' },
            { header: 'Payment', accessor: 'paymentStatus' },
            { header: 'Status', accessor: 'status' },
            {
              header: 'Amount',
              accessor: 'amount',
              render: (order) => formatRupees(order.amount),
              sortValue: (order) => Number(order.amount || 0)
            }
          ]}
          rows={report.recentOrders}
          getRowKey={(order) => order.id || order.orderNumber}
        />
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
