import Link from 'next/link';
import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import { getOrderById } from '@/lib/server/orders-service';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';
import { formatRupees } from '@/lib/currency';

export default function OrderDetailPage({ user, order }) {
  const addressLines = buildAddressLines(order);

  function printDeliveryLabel() {
    document.body.classList.add('printing-delivery-label');
    window.print();
    window.setTimeout(() => {
      document.body.classList.remove('printing-delivery-label');
    }, 500);
  }

  return (
    <Layout
      title={`Order ${order.orderNumber}`}
      subtitle="Detailed fulfillment, payment, and item breakdown for this order."
      user={user}
    >
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex gap-2 flex-wrap">
          <Link href="/admin/orders" className="btn btn-outline-dark rounded-pill px-4">
            Back to Orders
          </Link>
          <Link href={`/admin/orders/${order.id}/invoice`} className="btn btn-dark rounded-pill px-4">
            Invoice
          </Link>
          <button type="button" className="btn btn-dark rounded-pill px-4" onClick={printDeliveryLabel}>
            Print Delivery Label
          </button>
        </div>
        <div className="hero-chip-wrap">
          <span className="hero-chip">Status: {order.status}</span>
          <span className="hero-chip">Payment: {order.paymentStatus}</span>
          <span className="hero-chip">Total: {formatRupees(order.amount)}</span>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <SectionCard
            title="Order Items"
            description="Line items included in this order."
          >
            <div className="table-responsive">
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
          </SectionCard>
        </div>

        <div className="col-lg-4">
          <SectionCard
            title="Customer & Totals"
            description="Shipping identity and financial summary."
          >
            <div className="d-flex flex-column gap-3">
              <div>
                <div className="small text-muted">Customer</div>
                <div className="fw-semibold">{order.customer}</div>
                {order.email ? <div>{order.email}</div> : null}
                {order.phone ? <div>{order.phone}</div> : null}
                {addressLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
              <div>
                <div className="small text-muted">Order Date</div>
                <div className="fw-semibold">{order.orderDate}</div>
              </div>
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
          </SectionCard>
        </div>
      </div>

      <section className="delivery-label-card mt-4" aria-label="Delivery label">
        <div className="delivery-label-top">
          <div>
            <div className="invoice-label">Delivery Label</div>
            <div className="delivery-label-brand">Evalnila</div>
          </div>
          <div className="delivery-label-order">#{order.orderNumber}</div>
        </div>

        <div className="delivery-label-block">
          <div className="invoice-label">Ship To</div>
          <div className="delivery-label-name">{order.customer}</div>
          {addressLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
          {order.phone ? <div className="delivery-label-phone">Phone: {order.phone}</div> : null}
        </div>

        <div className="delivery-label-meta">
          <div>
            <span>Order Date</span>
            <strong>{order.orderDate}</strong>
          </div>
          <div>
            <span>Payment</span>
            <strong>{order.paymentStatus}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{order.status}</strong>
          </div>
        </div>

        <div className="delivery-label-items">
          <div className="invoice-label">Box Contents</div>
          {order.items.map((item) => (
            <div className="delivery-label-item" key={item.id}>
              <span>
                {item.name}
                {item.selectedSize ? ` / Size ${item.selectedSize}` : ''}
                {item.itemNotes ? ` / Notes ${item.itemNotes}` : ''}
              </span>
              <strong>x{item.quantity}</strong>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}

function buildAddressLines(order) {
  return [
    order.address,
    [order.city, order.country].filter(Boolean).join(', ') || order.location
  ].filter(Boolean);
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
