import Link from 'next/link';
import ProductPrice from '@/components/ProductPrice';

export default function ProductShowcaseCard({ product }) {
  const primaryImage = product.imageUrls?.[0] || product.imageUrl || '';

  return (
    <article className="product-card h-100">
      <div className="product-art">
        {primaryImage ? (
          <img src={primaryImage} alt={product.name} className="product-image" />
        ) : null}
        <Link href={`/store/categories/${product.categorySlug}`} className="product-art-badge">
          {product.category}
        </Link>
      </div>
      <div className="product-body">
        <p className="product-meta mb-2">{product.sku}</p>
        <h3 className="product-title">{product.name}</h3>
        <p className="product-copy">{product.description}</p>
        {product.sizes?.length ? (
          <div className="product-size-row" aria-label="Available sizes">
            {product.sizes.map((size) => (
              <span className="product-size-pill" key={size}>
                {size}
              </span>
            ))}
          </div>
        ) : null}
        <div className="product-availability-row">
          <span>{product.availabilityLabel}</span>
          <span>Dispatch in {product.dispatchDays} {Number(product.dispatchDays) === 1 ? 'day' : 'days'}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <ProductPrice product={product} />
          <Link href={`/store/products/${product.slug}`} className="btn btn-dark rounded-pill px-4">
            View Product
          </Link>
        </div>
      </div>
    </article>
  );
}
