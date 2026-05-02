import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id || row.orderNumber}>
                  <td>
                    <Link href={`/admin/orders/${row.id}`} className="fw-semibold text-dark">
                      {row.orderNumber}
                    </Link>
                  </td>
                  <td>{row.customer}</td>
                  <td>{row.orderDate}</td>
                  <td>{row.paymentStatus}</td>
                  <td>{row.status}</td>
                  <td>{formatRupees(row.amount)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark rounded-pill"
                      onClick={() => handleStatusChange(row.id, row)}
                    >
                      Advance
                    </button>
                  </td>
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
  const orders = await getOrders(query).catch(() => ordersPageRows);

  return {
    props: {
      orders
    }
  };
});
