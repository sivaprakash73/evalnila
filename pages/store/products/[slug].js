import Link from 'next/link';
import { useState } from 'react';
import StoreLayout from '@/components/StoreLayout';
import ProductShowcaseCard from '@/components/ProductShowcaseCard';
import ProductPrice from '@/components/ProductPrice';
import { getFeaturedProducts, getProductBySlug } from '@/lib/server/products-service';
import { query } from '@/lib/db';
import { useStore } from '@/context/StoreContext';
import { formatRupees } from '@/lib/currency';
import { calculateTaxIncludedBreakup } from '@/lib/order-totals';

export default function StoreProductPage({ product, relatedProducts }) {
  const { addToCart, addToWishlist, wishlistItems } = useStore();
  const priceBreakup = calculateTaxIncludedBreakup(product.price, product.taxPercentage ?? product.tax_percentage);
  const productImages = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
  const [activeImageUrl, setActiveImageUrl] = useState(productImages[0] || '');
  const [selectedSize, setSelectedSize] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [sizeError, setSizeError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const hasSizes = Boolean(product.sizes?.length);
  const normalizedItemNotes = itemNotes.trim();

  function handleAddToCart() {
    if (hasSizes && !selectedSize) {
      setSizeError('Select a size before adding this product to cart.');
      return;
    }

    setSizeError('');
    setActionMessage('');
    addToCart(
      {
        ...product,
        selectedSize: selectedSize || null,
        itemNotes: normalizedItemNotes || null
      },
      1
    );
    setActionMessage(`${product.name} added to cart.`);
  }

  function handleAddToWishlist() {
    const alreadySaved = wishlistItems.some((item) =>
      item.id === product.id &&
      (item.selectedSize || '') === (selectedSize || '') &&
      (item.itemNotes || '') === (normalizedItemNotes || '')
    );

    addToWishlist({
      ...product,
      selectedSize: selectedSize || null,
      itemNotes: normalizedItemNotes || null
    });
    setActionMessage(
      alreadySaved
        ? `${product.name} is already in your wishlist.`
        : `${product.name} added to wishlist.`
    );
  }

  return (
    <StoreLayout
      title={product.name}
      description={product.description || `${product.name} by Evalnila.`}
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="row g-4 align-items-start">
            <div className="col-lg-6">
              <div className="product-detail-art">
                {activeImageUrl ? (
                  <img src={activeImageUrl} alt={product.name} className="product-image" />
                ) : null}
                <Link href={`/store/categories/${product.categorySlug}`} className="product-art-badge">
                  {product.category}
                </Link>
              </div>
              {productImages.length > 1 ? (
                <div className="product-gallery-thumbs">
                  {productImages.map((imageUrl, index) => (
                    <button
                      type="button"
                      className="product-gallery-thumb"
                      onClick={() => setActiveImageUrl(imageUrl)}
                      key={`${imageUrl}-${index}`}
                      aria-label={`View product image ${index + 1}`}
                    >
                      <img src={imageUrl} alt={`${product.name} thumbnail ${index + 1}`} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="col-lg-6">
              <p className="eyebrow mb-2">Product Detail</p>
              <h1 className="section-heading">{product.name}</h1>
              <p className="product-meta">{product.sku}</p>
              <p className="store-copy">{product.description}</p>

              {product.highlights?.length ? (
                <div className="product-highlights">
                  {product.highlights.map((highlight) => (
                    <span key={highlight} className="product-highlight-pill">
                      {highlight}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="product-detail-stack">
                <div className="detail-row">
                  <span>Price</span>
                  <ProductPrice product={product} size="large" showLabel />
                </div>
                <div className="detail-row">
                  <span>Price Before Tax</span>
                  <strong>{formatRupees(priceBreakup.taxableAmount)}</strong>
                </div>
                <div className="detail-row">
                  <span>Included Tax{priceBreakup.taxPercentage ? ` (${priceBreakup.taxPercentage}%)` : ''}</span>
                  <strong>{formatRupees(priceBreakup.taxAmount)}</strong>
                </div>
                <div className="detail-row">
                  <span>Total Price</span>
                  <strong>{formatRupees(priceBreakup.grossAmount)}</strong>
                </div>
                <div className="detail-row">
                  <span>Availability</span>
                  <strong>{product.availabilityLabel}</strong>
                </div>
                <div className="detail-row">
                  <span>Dispatch</span>
                  <strong>{product.dispatchDays} {Number(product.dispatchDays) === 1 ? 'day' : 'days'}</strong>
                </div>
                <div className="detail-row">
                  <span>Category</span>
                  <strong>
                    <Link href={`/store/categories/${product.categorySlug}`} className="detail-link">
                      {product.category}
                    </Link>
                  </strong>
                </div>
              </div>

              {hasSizes ? (
                <div className="product-size-select">
                  <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
                    <span className="fw-semibold">Select Size</span>
                    {sizeError ? <span className="text-danger small">{sizeError}</span> : null}
                  </div>
                  <div className="product-size-options">
                    {product.sizes.map((size) => (
                      <button
                        type="button"
                        className={`product-size-option ${selectedSize === size ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedSize(size);
                          setSizeError('');
                        }}
                        key={size}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="product-notes-field">
                <label className="form-label fw-semibold" htmlFor="product-item-notes">
                  Notes
                </label>
                <textarea
                  id="product-item-notes"
                  className="form-control"
                  rows={3}
                  maxLength={500}
                  value={itemNotes}
                  onChange={(event) => setItemNotes(event.target.value)}
                  placeholder="Add stitching, size, color, or customization notes"
                />
              </div>

              <div className="d-flex gap-3 flex-wrap mt-4">
                <button
                  type="button"
                  className="btn btn-dark btn-lg rounded-pill px-4"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-lg rounded-pill px-4"
                  onClick={handleAddToWishlist}
                >
                  Add to Wishlist
                </button>
                <Link href="/store" className="btn btn-outline-dark btn-lg rounded-pill px-4">
                  Continue Shopping
                </Link>
              </div>

              {actionMessage ? (
                <div className="alert alert-success product-action-alert mt-4 mb-0" role="status">
                  {actionMessage}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="store-section">
        <div className="container-fluid">
          <div className="section-intro">
            <div>
              <p className="eyebrow mb-2">Related Picks</p>
              <h2 className="section-heading">More from Evalnila</h2>
            </div>
          </div>
          <div className="row g-4">
            {relatedProducts.map((item) => (
              <div className="col-md-6 col-xl-4" key={item.id || item.slug}>
                <ProductShowcaseCard product={item} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}

export async function getServerSideProps(context) {
  const product = await getProductBySlug(query, context.params.slug);

  if (!product) {
    return {
      notFound: true
    };
  }

  const relatedProducts = (await getFeaturedProducts(query, 6).catch(() => []))
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);

  return {
    props: {
      product,
      relatedProducts
    }
  };
}
