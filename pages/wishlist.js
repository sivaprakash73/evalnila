import Link from 'next/link';
import StoreLayout from '@/components/StoreLayout';
import ProductPrice from '@/components/ProductPrice';
import { useStore } from '@/context/StoreContext';

export default function WishlistPage() {
  const { wishlistItems, addToCart, updateWishlistItemOptions, removeFromWishlist, isReady } = useStore();

  function getPrimaryImage(item) {
    return item.imageUrls?.[0] || item.imageUrl || '';
  }

  function getItemKey(item) {
    return item.wishlistKey || `${item.id}:${item.selectedSize || ''}:${String(item.itemNotes || '').trim()}`;
  }

  return (
    <StoreLayout
      title="Wishlist"
      description="Products saved for later in the Evalnila storefront."
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="section-intro">
            <div>
              <p className="eyebrow mb-2">Wishlist</p>
              <h1 className="section-heading">Saved products for later.</h1>
            </div>
          </div>

          {!isReady ? (
            <div className="page-panel">
              <p className="store-copy mb-0">Loading wishlist...</p>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="page-panel empty-state">
              <h3 className="feature-title">Your wishlist is empty.</h3>
              <p className="feature-description">Save products from the storefront to compare and revisit them later.</p>
              <Link href="/store" className="btn btn-dark rounded-pill px-4">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="row g-4">
              {wishlistItems.map((item) => (
                <div className="col-md-6 col-xl-4" key={getItemKey(item)}>
                  <div className="content-block h-100">
                    {getPrimaryImage(item) ? (
                      <Link href={`/store/products/${item.slug}`} className="wishlist-card-image">
                        <img src={getPrimaryImage(item)} alt={item.name} />
                      </Link>
                    ) : null}
                    <p className="product-meta mb-2">{item.sku}</p>
                    <h3 className="feature-title">
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
                            updateWishlistItemOptions(getItemKey(item), {
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
                    <p className="feature-description">{item.description}</p>
                    <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                      <ProductPrice product={item} />
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-dark rounded-pill px-3"
                          onClick={() => addToCart(item, 1)}
                          disabled={Boolean(item.sizes?.length && !item.selectedSize)}
                        >
                          {item.sizes?.length && !item.selectedSize ? 'Select Size' : 'Add to Cart'}
                        </button>
                        <button type="button" className="btn btn-outline-dark rounded-pill px-3" onClick={() => removeFromWishlist(getItemKey(item))}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </StoreLayout>
  );
}
