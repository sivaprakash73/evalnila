import Link from 'next/link';
import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import DataTable from '@/components/DataTable';
import { ordersPageRows } from '@/lib/dashboard-data';
import { getOrders } from '@/lib/server/orders-service';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';
import { formatRupees } from '@/lib/currency';

export default function BillPrintPage({ user, orders }) {
  return (
    <Layout
      title="Bill Print"
      subtitle="Print courier address labels and product-detail bills from one screen."
      user={user}
    >
      <SectionCard
        title="Orders Ready To Print"
        description="Open an order to preview the two-page print set before sending it to the printer."
      >
        <DataTable
          columns={[
            {
              header: 'Order',
              accessor: 'orderNumber',
              render: (order) => <span className="fw-semibold">{order.orderNumber}</span>
            },
            { header: 'Customer', accessor: 'customer' },
            { header: 'Date', accessor: 'orderDate' },
            { header: 'Status', accessor: 'status' },
            { header: 'Payment', accessor: 'paymentStatus' },
            {
              header: 'Total',
              accessor: 'amount',
              render: (order) => formatRupees(order.amount),
              sortValue: (order) => Number(order.amount || 0)
            },
            {
              header: 'Print',
              sortable: false,
              searchValue: () => '',
              render: (order) => (
                <Link href={`/admin/bill-print/${order.id}`} className="btn btn-sm btn-dark rounded-pill px-3">
                  Print 2 Pages
                </Link>
              )
            }
          ]}
          rows={orders}
          getRowKey={(order) => order.id || order.orderNumber}
        />
      </SectionCard>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async () => {
  const orders = await getOrders(query).catch(() => ordersPageRows);

  return {
    props: {
      orders
    }
  };
});
