import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import FeatureCard from '@/components/FeatureCard';
import { withPageAuth } from '@/lib/server/with-auth';

const analyticsFeatures = [
  {
    title: 'Sales Analytics',
    description: 'Track revenue trends, average order value, and conversion-driven product performance.',
    meta: 'Revenue'
  },
  {
    title: 'Channel Insights',
    description: 'Compare storefront traffic, paid campaigns, and repeat-customer contribution.',
    meta: 'Traffic'
  },
  {
    title: 'Customer Cohorts',
    description: 'Review retention, repeat frequency, and high-value customer segments.',
    meta: 'Retention'
  },
  {
    title: 'Operational Health',
    description: 'Monitor stock pressure, delayed shipments, and refund risk in one view.',
    meta: 'Ops'
  }
];

export default function AnalyticsPage({ user }) {
  return (
    <Layout
      title="Analytics"
      subtitle="Premium reporting space for revenue, retention, and operations."
      user={user}
    >
      <SectionCard
        title="Growth Features"
        description="Core reporting modules that complete the Evalnila commerce stack."
      >
        <div className="row g-4">
          {analyticsFeatures.map((item) => (
            <div className="col-md-6" key={item.title}>
              <FeatureCard {...item} />
            </div>
          ))}
        </div>
      </SectionCard>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async () => ({
  props: {}
}));
