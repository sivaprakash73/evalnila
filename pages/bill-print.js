import Link from 'next/link';
import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
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
        <div className="table-responsive">
          <table className="table align-middle custom-table mb-0">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Print</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id || order.orderNumber}>
                  <td className="fw-semibold">{order.orderNumber}</td>
                  <td>{order.customer}</td>
                  <td>{order.orderDate}</td>
                  <td>{order.status}</td>
                  <td>{order.paymentStatus}</td>
                  <td>{formatRupees(order.amount)}</td>
                  <td>
                    <Link
                      href={`/admin/bill-print/${order.id}`}
                      className="btn btn-sm btn-dark rounded-pill px-3"
                    >
                      Print 2 Pages
                    </Link>
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
