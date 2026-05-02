import Link from 'next/link';
import StoreLayout from '@/components/StoreLayout';
import { getCustomerById } from '@/lib/server/customer-auth-service';
import { getOrders } from '@/lib/server/orders-service';
import { query } from '@/lib/db';
import { withCustomerPageAuth } from '@/lib/server/with-customer-auth';

export default function AccountOrdersPage({ orders }) {
  return (
    <StoreLayout
      title="Order History"
      description="Customer order history area for Evalnila."
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="page-panel">
            <p className="eyebrow mb-2">Order History</p>
            <h1 className="section-heading">Review recent purchase activity.</h1>

            <div className="table-responsive mt-4">
              <table className="table align-middle custom-table mb-0">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id || order.orderNumber}>
                      <td>{order.orderNumber}</td>
                      <td>{order.status}</td>
                      <td>{order.paymentStatus}</td>
                      <td>
                        <Link href={`/order-tracking?orderNumber=${order.orderNumber}`} className="btn btn-sm btn-outline-dark rounded-pill">
                          Track
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}

export const getServerSideProps = withCustomerPageAuth(async (_context, customer) => {
  const account = await getCustomerById(query, customer.sub);
  const orderRows = await getOrders(query).catch(() => []);
  const orders = orderRows.filter(
    (item) =>
      String(item.customerId) === String(customer.sub) ||
      item.customer === `${account.firstName} ${account.lastName}`
  );

  return {
    props: {
      orders
    }
  };
});
