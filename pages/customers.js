import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import DataTable from '@/components/DataTable';
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
        <DataTable
          columns={[
            { header: 'Customer', accessor: 'name' },
            { header: 'Email', accessor: 'email' },
            { header: 'Mobile No', accessor: (row) => row.phone || '-' },
            { header: 'Location', accessor: 'location' },
            { header: 'Orders', accessor: 'orders', sortValue: (row) => Number(row.orders || 0) },
            {
              header: 'Lifetime Value',
              accessor: 'lifetimeValue',
              render: (row) => formatRupees(row.lifetimeValue),
              sortValue: (row) => Number(row.lifetimeValue || 0)
            }
          ]}
          rows={customers}
          getRowKey={(row) => row.id || row.email}
        />
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
