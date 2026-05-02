import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import DataTable from '@/components/DataTable';
import { ordersPageRows } from '@/lib/dashboard-data';
import { getOrders } from '@/lib/server/orders-service';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';
import { useState } from 'react';
import Link from 'next/link';
import { formatRupees } from '@/lib/currency';

export default function OrdersPage({ user, orders }) {
  const [rows, setRows] = useState(orders);

  async function handleStatusChange(id, current) {
    const nextStatus = current.status === 'Pending' ? 'Packed' : current.status === 'Packed' ? 'Shipped' : 'Delivered';
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: nextStatus,
        paymentStatus: current.paymentStatus
      })
    });

    if (!response.ok) {
      return;
    }

    setRows((existing) =>
      existing.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
    );
  }

  return (
    <Layout
      title="Orders"
      subtitle="Track payments, shipping, and fulfillment exceptions."
      user={user}
    >
      <SectionCard
        title="All Orders"
        description="Snapshot of current orders from the store pipeline."
      >
        <DataTable
          columns={[
            {
              header: 'Order',
              accessor: 'orderNumber',
              render: (row) => (
                <Link href={`/admin/orders/${row.id}`} className="fw-semibold text-dark">
                  {row.orderNumber}
                </Link>
              )
            },
            { header: 'Customer', accessor: 'customer' },
            { header: 'Date', accessor: 'orderDate' },
            { header: 'Payment', accessor: 'paymentStatus' },
            { header: 'Status', accessor: 'status' },
            {
              header: 'Amount',
              accessor: 'amount',
              render: (row) => formatRupees(row.amount),
              sortValue: (row) => Number(row.amount || 0)
            },
            {
              header: 'Action',
              sortable: false,
              searchValue: () => '',
              render: (row) => (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark rounded-pill"
                  onClick={() => handleStatusChange(row.id, row)}
                >
                  Advance
                </button>
              )
            }
          ]}
          rows={rows}
          getRowKey={(row) => row.id || row.orderNumber}
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
