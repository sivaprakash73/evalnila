import Link from 'next/link';
import StoreLayout from '@/components/StoreLayout';
import { useStore } from '@/context/StoreContext';
import { getCustomerById } from '@/lib/server/customer-auth-service';
import { getOrders } from '@/lib/server/orders-service';
import { query } from '@/lib/db';
import { withCustomerPageAuth } from '@/lib/server/with-customer-auth';

export default function AccountPage({ customer, account, orders }) {
  const { lastOrderNumber, wishlistItems, cartCount } = useStore();
  const latestOrder = orders[0]?.orderNumber || lastOrderNumber || 'No recent orders';

  return (
    <StoreLayout
      title="My Account"
      description="Customer account hub for Evalnila."
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="page-panel">
            <p className="eyebrow mb-2">Customer Account</p>
            <h1 className="section-heading">Manage your Evalnila activity.</h1>
            <p className="store-copy mb-0">
              This account area is ready to expand into authenticated customer profiles, saved addresses, and order history.
            </p>
          </div>

          <div className="row g-4 mt-1">
            <div className="col-md-4">
              <div className="content-block h-100">
                <div className="invoice-label">Last Order</div>
                <h3 className="feature-title mb-2">{latestOrder}</h3>
                <p className="feature-description mb-3">Track your latest purchase or start a new order from the storefront.</p>
                <Link href="/order-tracking" className="btn btn-dark rounded-pill px-4">
                  Track Order
                </Link>
              </div>
            </div>

            <div className="col-md-4">
              <div className="content-block h-100">
                <div className="invoice-label">Wishlist</div>
                <h3 className="feature-title mb-2">{wishlistItems.length} saved items</h3>
                <p className="feature-description mb-3">Review products you have bookmarked for later.</p>
                <Link href="/wishlist" className="btn btn-outline-dark rounded-pill px-4">
                  Open Wishlist
                </Link>
              </div>
            </div>

            <div className="col-md-4">
              <div className="content-block h-100">
                <div className="invoice-label">Cart</div>
                <h3 className="feature-title mb-2">{cartCount} items pending</h3>
                <p className="feature-description mb-3">Continue checkout or refine quantities before ordering.</p>
                <Link href="/cart" className="btn btn-outline-dark rounded-pill px-4">
                  View Cart
                </Link>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-1">
            <div className="col-lg-6">
              <div className="page-panel h-100">
                <h2 className="section-heading h3">Profile Snapshot</h2>
                <div className="summary-stack">
                  <div className="summary-row">
                    <span>Name</span>
                    <strong>{account.firstName} {account.lastName}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Email</span>
                    <strong>{account.email}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Member Since</span>
                    <strong>{new Date().getFullYear()}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="page-panel h-100">
                <h2 className="section-heading h3">Quick Actions</h2>
                <div className="account-links">
                  <Link href="/account/orders" className="account-link-card">
                    Order History
                  </Link>
                  <Link href="/account/profile" className="account-link-card">
                    Profile Settings
                  </Link>
                  <Link href="/checkout" className="account-link-card">
                    Checkout
                  </Link>
                  <Link href="/store" className="account-link-card">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}

export const getServerSideProps = withCustomerPageAuth(async (_context, customer) => {
  const [account, orderRows] = await Promise.all([
    getCustomerById(query, customer.sub),
    getOrders(query).catch(() => [])
  ]);

  const orders = orderRows.filter(
    (item) =>
      String(item.customerId) === String(customer.sub) ||
      item.customer === `${account.firstName} ${account.lastName}`
  );

  return {
    props: {
      account,
      orders
    }
  };
});
