import StoreLayout from '@/components/StoreLayout';
import { useState } from 'react';
import { useRouter } from 'next/router';
import ProductPrice from '@/components/ProductPrice';
import { useStore } from '@/context/StoreContext';
import { formatRupees } from '@/lib/currency';
import { calculateCartTotals } from '@/lib/order-totals';
import { query } from '@/lib/db';
import { getShippingSettings } from '@/lib/server/shipping-service';

export default function CheckoutPage({ shippingSettings }) {
  const router = useRouter();
  const { cartItems, cartSubtotal, clearCart, setLastOrderNumber } = useStore();
  const [placed, setPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    card: '',
    paymentMethod: 'razorpay'
  });
  const totals = calculateCartTotals(cartItems, shippingSettings);
  const shipping = totals.shippingFee;
  const total = totals.total;

  function getPrimaryImage(item) {
    return item.imageUrls?.[0] || item.imageUrl || '';
  }

  async function placeOrder() {
    setLoading(true);
    setError('');

    if (form.paymentMethod === 'razorpay') {
      await payWithRazorpay();
      return;
    }

    const payload = await submitStandardOrder({
      paymentMethod: form.paymentMethod
    });

    if (!payload) {
      return;
    }

    completeOrder(payload.order.orderNumber);
  }

  async function payWithRazorpay() {
    const orderResponse = await fetch('/api/store/payments/razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: buildCustomerPayload(),
        items: cartItems
      })
    });

    const orderPayload = await orderResponse.json();

    if (!orderResponse.ok) {
      setError(orderPayload.message || 'Unable to start Razorpay checkout.');
      setLoading(false);
      return;
    }

    try {
      await loadRazorpayScript();
    } catch (scriptError) {
      setError(scriptError.message);
      setLoading(false);
      return;
    }

    const razorpay = new window.Razorpay({
      key: orderPayload.keyId,
      amount: orderPayload.razorpayOrder.amount,
      currency: orderPayload.razorpayOrder.currency,
      name: 'Evalnila',
      description: 'Evalnila storefront order',
      order_id: orderPayload.razorpayOrder.id,
      handler: async function (response) {
        const verifyResponse = await fetch('/api/store/payments/razorpay-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...response,
            customer: buildCustomerPayload(),
            items: cartItems
          })
        });

        const verifyPayload = await verifyResponse.json();

        if (!verifyResponse.ok) {
          setError(verifyPayload.message || 'Razorpay verification failed.');
          setLoading(false);
          return;
        }

        completeOrder((verifyPayload.order || orderPayload.order).orderNumber);
      },
      prefill: {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        contact: form.phone
      },
      notes: {
        address: form.address
      },
      theme: {
        color: '#D4AF37'
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
        }
      }
    });

    razorpay.open();
  }

  async function submitStandardOrder({ paymentMethod }) {
    const response = await fetch('/api/store/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: buildCustomerPayload(),
        items: cartItems,
        paymentMethod
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.message || 'Unable to place order.');
      setLoading(false);
      return null;
    }

    return payload;
  }

  function completeOrder(orderNumber) {
    setPlaced(true);
    setLastOrderNumber(orderNumber);
    clearCart();
    setTimeout(() => {
      router.push(`/order-tracking?orderNumber=${orderNumber}`);
    }, 900);
  }

  function buildCustomerPayload() {
    return {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      address: form.address,
      city: form.city,
      country: form.country,
      phone: form.phone
    };
  }

  return (
    <StoreLayout
      title="Checkout"
      description="Secure checkout flow for Evalnila."
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="page-panel checkout-form-panel">
                <p className="eyebrow mb-2">Checkout</p>
                <h1 className="section-heading">Complete your order.</h1>

                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <label className="form-label">First Name</label>
                    <input className="form-control" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last Name</label>
                    <input className="form-control" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Email</label>
                    <input className="form-control" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Address</label>
                    <input className="form-control" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">City</label>
                    <input className="form-control" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Country</label>
                    <input className="form-control" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Payment Method</label>
                    <div className="payment-options">
                      <button
                        type="button"
                        className={`payment-option ${form.paymentMethod === 'razorpay' ? 'active' : ''}`}
                        onClick={() => setForm((current) => ({ ...current, paymentMethod: 'razorpay' }))}
                      >
                        Razorpay
                      </button>
                      <button
                        type="button"
                        className={`payment-option ${form.paymentMethod === 'cod' ? 'active' : ''}`}
                        onClick={() => setForm((current) => ({ ...current, paymentMethod: 'cod' }))}
                      >
                        Cash on Delivery
                      </button>
                      <button
                        type="button"
                        className={`payment-option ${form.paymentMethod === 'upi' ? 'active' : ''}`}
                        onClick={() => setForm((current) => ({ ...current, paymentMethod: 'upi' }))}
                      >
                        Manual UPI / Wallet
                      </button>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Payment Details</label>
                    <input
                      className="form-control"
                      placeholder={
                        form.paymentMethod === 'razorpay'
                          ? 'Handled securely in Razorpay Checkout'
                          : form.paymentMethod === 'upi'
                            ? 'UPI ID or wallet reference'
                            : 'Payment collected on delivery'
                      }
                      value={form.card}
                      onChange={(event) => setForm((current) => ({ ...current, card: event.target.value }))}
                      disabled={form.paymentMethod === 'cod' || form.paymentMethod === 'razorpay'}
                    />
                  </div>
                  <div className="col-12 checkout-action-row">
                    <button type="button" className="btn btn-dark rounded-pill px-4" onClick={placeOrder} disabled={!cartItems.length || loading}>
                      {loading ? 'Placing Order...' : 'Place Order'}
                    </button>
                  </div>
                </div>
                {placed ? <div className="alert alert-success mt-4 mb-0">Order placed. Redirecting to tracking...</div> : null}
                {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}
              </div>
            </div>

            <div className="col-lg-5">
              <div className="page-panel checkout-summary-panel">
                <h2 className="section-heading h3">Checkout Summary</h2>
                <p className="store-copy">
                  Razorpay standard checkout is scaffolded. Set your Razorpay test keys in `.env.local` to use it end-to-end.
                </p>
                <div className="summary-stack">
                  {cartItems.map((item) => (
                    <div className="summary-row checkout-item-row" key={item.cartKey || item.id}>
                      <div className="checkout-item-main">
                        {getPrimaryImage(item) ? (
                          <img src={getPrimaryImage(item)} alt={item.name} className="checkout-item-thumb" />
                        ) : null}
                        <span>
                          {item.name}
                          {item.selectedSize ? <small>Size: {item.selectedSize}</small> : null}
                          {item.itemNotes ? <small>Notes: {item.itemNotes}</small> : null}
                          <small>Qty: {item.quantity}</small>
                        </span>
                      </div>
                      <ProductPrice product={item} />
                    </div>
                  ))}
                  <div className="summary-row">
                    <span>Price Subtotal (incl. tax)</span>
                    <strong>{formatRupees(totals.itemSubtotal || cartSubtotal)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Method</span>
                    <strong>{form.paymentMethod.toUpperCase()}</strong>
                  </div>
                  {cartItems.length ? (
                    <>
                      <div className="summary-row">
                        <span>Included Tax</span>
                        <strong>{formatRupees(totals.taxAmount)}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Shipping</span>
                        <strong>{shipping ? formatRupees(shipping) : 'Free'}</strong>
                      </div>
                    </>
                  ) : null}
                  <div className="summary-row summary-row-total">
                    <span>Total</span>
                    <strong>{formatRupees(total)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}

export async function getServerSideProps() {
  return {
    props: {
      shippingSettings: await getShippingSettings(query)
    }
  };
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout script.'));
    document.body.appendChild(script);
  });
}
