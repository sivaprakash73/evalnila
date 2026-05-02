import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import StoreLayout from '@/components/StoreLayout';
import { useStore } from '@/context/StoreContext';
import { formatRupees } from '@/lib/currency';

const trackingSteps = [
  'Order Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery'
];

export default function OrderTrackingPage() {
  const router = useRouter();
  const { lastOrderNumber } = useStore();
  const [trackingId, setTrackingId] = useState('ORD-24081');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initialOrderNumber = router.query.orderNumber || lastOrderNumber || 'ORD-24081';
    setTrackingId(String(initialOrderNumber));
  }, [router.query.orderNumber, lastOrderNumber]);

  useEffect(() => {
    if (!trackingId) {
      return;
    }

    let active = true;

    async function loadOrder() {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/store/orders/track?orderNumber=${encodeURIComponent(trackingId)}`);
      const payload = await response.json();

      if (!active) {
        return;
      }

      if (!response.ok) {
        setOrder(null);
        setError(payload.message || 'Order not found.');
        setLoading(false);
        return;
      }

      setOrder(payload);
      setLoading(false);
    }

    loadOrder();

    return () => {
      active = false;
    };
  }, [trackingId]);

  return (
    <StoreLayout
      title="Order Tracking"
      description="Track an Evalnila order by order number."
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="page-panel h-100">
                <p className="eyebrow mb-2">Track Order</p>
                <h1 className="section-heading">Follow order progress.</h1>
                <p className="store-copy">
                  Enter an order number to check the current fulfillment stage.
                </p>
                <div className="mt-4">
                  <label className="form-label">Order Number</label>
                  <input
                    className="form-control"
                    value={trackingId}
                    onChange={(event) => setTrackingId(event.target.value)}
                  />
                </div>
                {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}
              </div>
            </div>

            <div className="col-lg-7">
              <div className="page-panel h-100">
                <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                  <div>
                    <div className="invoice-label">Tracking Number</div>
                    <div className="fw-semibold">{trackingId}</div>
                  </div>
                  <span className="hero-chip">
                    {loading ? 'Loading...' : order ? `Status: ${order.status}` : 'Awaiting lookup'}
                  </span>
                </div>

                <div className="tracking-stack mt-4">
                  {trackingSteps.map((step, index) => (
                    <div className="tracking-item" key={step}>
                      <div className={`tracking-dot ${order && isTrackingStepActive(order.status, step, index) ? 'active' : ''}`} />
                      <div>
                        <div className="fw-semibold">{step}</div>
                        <div className="feature-description">
                          {order ? describeTrackingStep(order.status, step, index) : 'No order loaded yet.'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {order ? (
                  <div className="content-block mt-4">
                    <div className="summary-row">
                      <span>Customer</span>
                      <strong>{order.customer}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Total</span>
                      <strong>{formatRupees(order.amount)}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Payment</span>
                      <strong>{order.paymentStatus}</strong>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}

function isTrackingStepActive(status, step, index) {
  const activeStep = mapStatusToTrackingStep(status);
  const activeIndex = trackingSteps.indexOf(activeStep);
  return activeIndex >= 0 && index <= activeIndex;
}

function mapStatusToTrackingStep(status) {
  const lookup = {
    Pending: 'Order Confirmed',
    Packed: 'Packed',
    Shipped: 'Shipped',
    Delivered: 'Out for Delivery'
  };

  return lookup[status] || 'Order Confirmed';
}

function describeTrackingStep(status, step, index) {
  const activeStep = mapStatusToTrackingStep(status);
  const activeIndex = trackingSteps.indexOf(activeStep);

  if (activeIndex === -1) {
    return 'Waiting for updates.';
  }

  if (index < activeIndex) {
    return 'Completed successfully.';
  }

  if (index === activeIndex) {
    return 'Current fulfillment stage.';
  }

  return 'Waiting for the next update.';
}
