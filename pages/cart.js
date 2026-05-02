import Link from 'next/link';
import StoreLayout from '@/components/StoreLayout';
import ProductPrice from '@/components/ProductPrice';
import { useStore } from '@/context/StoreContext';
import { formatRupees } from '@/lib/currency';
import { calculateCartTotals } from '@/lib/order-totals';
import { query } from '@/lib/db';
import { getShippingSettings } from '@/lib/server/shipping-service';

export default function CartPage({ shippingSettings }) {
  const {
    cartItems,
    cartSubtotal,
    updateCartQuantity,
    updateCartItemOptions,
    removeFromCart,
    addToWishlist,
    isReady
  } = useStore();
  const totals = calculateCartTotals(cartItems, shippingSettings);
  const subtotal = totals.itemSubtotal || cartSubtotal;
  const shipping = totals.shippingFee;
  const total = totals.total;

  function getPrimaryImage(item) {
    return item.imageUrls?.[0] || item.imageUrl || '';
  }

  function getItemKey(item) {
    return item.cartKey || `${item.id}:${item.selectedSize || ''}:${String(item.itemNotes || '').trim()}`;
  }

  function moveToWishlist(item) {
    addToWishlist(item);
    removeFromCart(getItemKey(item));
  }

  return (
    <StoreLayout
      title="Cart"
      description="Review selected products before checkout."
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="section-intro">
            <div>
              <p className="eyebrow mb-2">Cart</p>
              <h1 className="section-heading">Review your selected items.</h1>
            </div>
            <Link href="/checkout" className="btn btn-dark rounded-pill px-4">
              Proceed to Checkout
            </Link>
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="page-panel">
                {!isReady ? (
                  <p className="store-copy mb-0">Loading cart...</p>
                ) : cartItems.length === 0 ? (
                  <div className="empty-state">
                    <h3 className="feature-title">Your cart is empty.</h3>
                    <p className="feature-description">Add products from the storefront to continue.</p>
                    <Link href="/store" className="btn btn-dark rounded-pill px-4">
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="cart-mobile-list">
                      {cartItems.map((item) => (
                        <article className="cart-mobile-card" key={getItemKey(item)}>
                          <div className="cart-mobile-main">
                            {getPrimaryImage(item) ? (
                              <Link href={`/store/products/${item.slug}`} className="cart-item-thumb">
                                <img src={getPrimaryImage(item)} alt={item.name} />
                              </Link>
                            ) : null}
                            <div>
                              <p className="product-meta mb-1">{item.sku}</p>
                              <h3 className="cart-mobile-title">
                                <Link href={`/store/products/${item.slug}`} className="detail-link">
                                  {item.name}
                                </Link>
                              </h3>
                              {item.sizes?.length ? (
                                <label className="cart-size-field">
                                  <span>Size</span>
                                  <select
                                    className="form-select form-select-sm"
                                    value={item.selectedSize || ''}
                                    onChange={(event) =>
                                      updateCartItemOptions(getItemKey(item), {
                                        selectedSize: event.target.value
                                      })
                                    }
                                  >
                                    <option value="">Select size</option>
                                    {item.sizes.map((size) => (
                                      <option value={size} key={size}>
                                        {size}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : item.selectedSize ? (
                                <div className="small text-muted">Size: {item.selectedSize}</div>
                              ) : null}
                              {item.itemNotes ? <div className="small text-muted">Notes: {item.itemNotes}</div> : null}
                            </div>
                          </div>
                          <div className="cart-mobile-price">
                            <ProductPrice product={item} />
                            <strong>{formatRupees(item.price * item.quantity)}</strong>
                          </div>
                          <div className="cart-mobile-actions">
                            <div className="qty-controls">
                              <button type="button" onClick={() => updateCartQuantity(getItemKey(item), item.quantity - 1)}>
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button type="button" onClick={() => updateCartQuantity(getItemKey(item), item.quantity + 1)}>
                                +
                              </button>
                            </div>
                            <button type="button" className="btn btn-sm btn-outline-dark rounded-pill" onClick={() => removeFromCart(getItemKey(item))}>
                              Remove
                            </button>
                            <button type="button" className="btn btn-sm btn-dark rounded-pill" onClick={() => moveToWishlist(item)}>
                              Move to Wishlist
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="table-responsive cart-table-wrap">
                      <table className="table align-middle custom-table mb-0">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item) => (
                          <tr key={getItemKey(item)}>
                            <td>
                              <div className="cart-table-product">
                                {getPrimaryImage(item) ? (
                                  <Link href={`/store/products/${item.slug}`} className="cart-item-thumb">
                                    <img src={getPrimaryImage(item)} alt={item.name} />
                                  </Link>
                                ) : null}
                                <div>
                                  <Link href={`/store/products/${item.slug}`} className="detail-link fw-semibold">
                                    {item.name}
                                  </Link>
                                  {item.sizes?.length ? (
                                    <label className="cart-size-field">
                                      <span>Size</span>
                                      <select
                                        className="form-select form-select-sm"
                                        value={item.selectedSize || ''}
                                        onChange={(event) =>
                                          updateCartItemOptions(getItemKey(item), {
                                            selectedSize: event.target.value
                                          })
                                        }
                                      >
                                        <option value="">Select size</option>
                                        {item.sizes.map((size) => (
                                          <option value={size} key={size}>
                                            {size}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  ) : item.selectedSize ? (
                                    <div className="small text-muted">Size: {item.selectedSize}</div>
                                  ) : null}
                                  {item.itemNotes ? <div className="small text-muted">Notes: {item.itemNotes}</div> : null}
                                </div>
                              </div>
                            </td>
                            <td>{item.sku}</td>
                            <td>
                              <div className="qty-controls">
                                <button type="button" onClick={() => updateCartQuantity(getItemKey(item), item.quantity - 1)}>
                                  -
                                </button>
                                <span>{item.quantity}</span>
                                <button type="button" onClick={() => updateCartQuantity(getItemKey(item), item.quantity + 1)}>
                                  +
                                </button>
                              </div>
                            </td>
                            <td>
                              <ProductPrice product={item} />
                            </td>
                            <td>{formatRupees(item.price * item.quantity)}</td>
                            <td>
                              <div className="cart-action-buttons">
                                <button type="button" className="btn btn-sm btn-outline-dark rounded-pill" onClick={() => removeFromCart(getItemKey(item))}>
                                  Remove
                                </button>
                                <button type="button" className="btn btn-sm btn-dark rounded-pill" onClick={() => moveToWishlist(item)}>
                                  Move to Wishlist
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="col-lg-4">
              <div className="page-panel order-summary-panel">
                <h2 className="section-heading h3">Order Summary</h2>
                <div className="summary-stack">
                  <div className="summary-row">
                    <span>Price Subtotal (incl. tax)</span>
                    <strong>{formatRupees(subtotal)}</strong>
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
                <Link href="/checkout" className="btn btn-dark rounded-pill px-4 mt-4">
                  Continue to Checkout
                </Link>
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
