import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import { customersPageRows } from '@/lib/dashboard-data';
import { getCustomers } from '@/lib/server/customers-service';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';
import { formatRupees } from '@/lib/currency';

export default function CustomersPage({ user, customers }) {
  return (
    <Layout
      title="Customers"
      subtitle="Review customer value, regions, and account activity."
      user={user}
    >
      <SectionCard
        title="Customer Directory"
        description="Useful starter view for CRM and support operations."
      >
        <div className="table-responsive">
          <table className="table align-middle custom-table mb-0">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Location</th>
                <th>Orders</th>
                <th>Lifetime Value</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((row) => (
                <tr key={row.id || row.email}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.location}</td>
                  <td>{row.orders}</td>
                  <td>{formatRupees(row.lifetimeValue)}</td>
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
  const customers = await getCustomers(query).catch(() => customersPageRows);

  return {
    props: {
      customers
    }
  };
});
