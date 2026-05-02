import Head from 'next/head';
import Link from 'next/link';
import { getOrderById } from '@/lib/server/orders-service';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';
import { formatRupees } from '@/lib/currency';

export default function BillPrintDetailPage({ order }) {
  const addressLines = buildAddressLines(order);

  return (
    <>
      <Head>
        <title>Bill Print {order.orderNumber} | Evalnila</title>
      </Head>

      <main className="bill-print-shell">
        <div className="invoice-toolbar no-print">
          <Link href="/admin/bill-print" className="btn btn-outline-dark rounded-pill px-4">
            Back to Bill Print
          </Link>
          <button type="button" className="btn btn-dark rounded-pill px-4" onClick={() => window.print()}>
            Print 2 Pages
          </button>
        </div>

        <section className="bill-print-page bill-print-label-page">
          <div className="bill-print-page-marker no-print">Page 1: Courier Address Label</div>
          <div className="courier-label-sticker" aria-label="Courier address label">
            <div className="delivery-label-top">
              <div>
                <div className="invoice-label">Courier Label</div>
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
          </div>
        </section>

        <section className="bill-print-page bill-print-invoice-page">
          <div className="bill-print-page-marker no-print">Page 2: Product Detail Bill</div>
          <div className="invoice-card bill-print-invoice-card">
            <div className="invoice-header">
              <div>
                <div className="invoice-brand">Evalnila</div>
                <div className="invoice-muted">Product detail bill</div>
              </div>
              <div className="text-end">
                <div className="invoice-title">Bill</div>
                <div className="invoice-muted">#{order.orderNumber}</div>
              </div>
            </div>

            <div className="invoice-grid">
              <div>
                <div className="invoice-label">Customer</div>
                <div className="fw-semibold">{order.customer}</div>
                {order.email ? <div>{order.email}</div> : null}
                {order.phone ? <div>{order.phone}</div> : null}
                {addressLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>

              <div>
                <div className="invoice-label">Order Details</div>
                <div>Date: {order.orderDate}</div>
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
          </div>
        </section>
      </main>
    </>
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
        destination: '/admin/bill-print',
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
