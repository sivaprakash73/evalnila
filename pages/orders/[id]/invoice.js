import Head from 'next/head';
import Link from 'next/link';
import { getOrderById } from '@/lib/server/orders-service';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';
import { formatRupees } from '@/lib/currency';

export default function OrderInvoicePage({ order }) {
  return (
    <>
      <Head>
        <title>Invoice {order.orderNumber} | Evalnila</title>
      </Head>

      <main className="invoice-shell">
        <div className="invoice-toolbar no-print">
          <Link href={`/admin/orders/${order.id}`} className="btn btn-outline-dark rounded-pill px-4">
            Back to Order
          </Link>
          <button type="button" className="btn btn-dark rounded-pill px-4" onClick={() => window.print()}>
            Print Invoice
          </button>
        </div>

        <section className="invoice-card">
          <div className="invoice-header">
            <div>
              <div className="invoice-brand">
                Evalnila
              </div>
              <div className="invoice-muted">Premium commerce operations</div>
            </div>
            <div className="text-end">
              <div className="invoice-title">Invoice</div>
              <div className="invoice-muted">#{order.orderNumber}</div>
            </div>
          </div>

          <div className="invoice-grid">
            <div>
              <div className="invoice-label">Billed To</div>
              <div className="fw-semibold">{order.customer}</div>
              {order.email ? <div>{order.email}</div> : null}
              {order.phone ? <div>{order.phone}</div> : null}
              {order.location ? <div>{order.location}</div> : null}
            </div>

            <div>
              <div className="invoice-label">Order Details</div>
              <div>Date: {order.orderDate}</div>
              <div>Status: {order.status}</div>
              <div>Payment: {order.paymentStatus}</div>
            </div>
          </div>

          <div className="table-responsive mt-4">
            <table className="table align-middle custom-table mb-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>{item.name}</div>
                      {item.selectedSize ? <div className="small text-muted">Size: {item.selectedSize}</div> : null}
                      {item.itemNotes ? <div className="small text-muted">Notes: {item.itemNotes}</div> : null}
                    </td>
                    <td>{item.sku}</td>
                    <td>{item.quantity}</td>
                    <td>{formatRupees(item.unitPrice)}</td>
                    <td>{formatRupees(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoice-totals">
            <div className="summary-stack">
              <div className="summary-row">
                <span>Price Subtotal (incl. tax)</span>
                <strong>{formatRupees(order.subtotal)}</strong>
              </div>
              <div className="summary-row">
                <span>Included Tax</span>
                <strong>{formatRupees(order.taxAmount || 0)}</strong>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <strong>{order.shippingFee ? formatRupees(order.shippingFee) : 'Free'}</strong>
              </div>
              <div className="summary-row summary-row-total">
                <span>Total</span>
                <strong>{formatRupees(order.amount)}</strong>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export const getServerSideProps = withPageAuth(async (context) => {
  const order = await getOrderById(query, context.params.id);

  if (!order) {
    return {
      redirect: {
        destination: '/admin/orders',
        permanent: false
      }
    };
  }

  return {
    props: {
      order
    }
  };
});
