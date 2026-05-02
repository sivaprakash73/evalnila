import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import SectionCard from '@/components/SectionCard';
import ProgressList from '@/components/ProgressList';
import SimpleTable from '@/components/SimpleTable';
import TrendBars from '@/components/TrendBars';
import { buildDashboardResponse } from '@/lib/server/dashboard-service';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';
import FeatureCard from '@/components/FeatureCard';
import { formatRupees } from '@/lib/currency';

const commerceFeatures = [
  {
    title: 'JWT Admin Access',
    description: 'Protected admin routes, secure cookie sessions, and server-side access control.',
    meta: 'Security'
  },
  {
    title: 'Catalog Management',
    description: 'Create products, manage pricing, stock, category mapping, and SKU structure.',
    meta: 'Catalog'
  },
  {
    title: 'Order Operations',
    description: 'Review payment state, packing stage, shipping progress, and customer fulfillment.',
    meta: 'Orders'
  },
  {
    title: 'Server Deployment',
    description: 'Ready for VPS or container deployment with Docker, Compose, and PM2 setup.',
    meta: 'Deploy'
  }
];

export default function DashboardPage({
  user,
  summary,
  topProducts,
  orderStatus,
  monthlySales,
  recentOrders
}) {
  return (
    <Layout
      title="Dashboard"
      subtitle="Premium operations overview for the Evalnila commerce setup."
      user={user}
    >
      <div className="row g-4">
        {summary.map((item) => (
          <div className="col-sm-6 col-xl-3" key={item.label}>
            <StatCard {...item} />
          </div>
        ))}
      </div>

      <div className="row g-4 mt-1">
        <div className="col-xl-8">
          <SectionCard
            title="Revenue Trend"
            description="Monthly sales performance for the current financial year."
          >
            <TrendBars data={monthlySales} />
          </SectionCard>
        </div>

        <div className="col-xl-4">
          <SectionCard
            title="Order Pipeline"
            description="Current fulfillment health by status."
          >
            <ProgressList items={orderStatus} />
          </SectionCard>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-xl-7">
          <SectionCard
            title="Recent Orders"
            description="Latest customer orders and fulfillment stage."
          >
            <SimpleTable
              columns={['Order', 'Customer', 'Amount', 'Status']}
              rows={recentOrders.map((order) => [
                order.orderNumber,
                order.customer,
                formatRupees(order.amount),
                order.status
              ])}
            />
          </SectionCard>
        </div>

        <div className="col-xl-5">
          <SectionCard
            title="Top Products"
            description="Best sellers by revenue contribution."
          >
            <SimpleTable
              columns={['Product', 'SKU', 'Revenue']}
              rows={topProducts.map((product) => [
                product.name,
                product.sku,
                formatRupees(product.revenue)
              ])}
            />
          </SectionCard>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-12">
          <SectionCard
            title="Platform Features"
            description="Core building blocks included in this Evalnila admin starter."
          >
            <div className="row g-4">
              {commerceFeatures.map((item) => (
                <div className="col-md-6 col-xl-3" key={item.title}>
                  <FeatureCard {...item} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async () => {
  const data = await buildDashboardResponse(query);

  return {
    props: data
  };
});
