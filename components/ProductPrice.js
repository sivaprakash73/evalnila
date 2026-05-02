import { formatRupees, getProductPricing } from '@/lib/currency';

export default function ProductPrice({ product, size = 'default', showLabel = false }) {
  const { mrp, specialPrice, hasDisplayMrp, hasMrpDiscount, discountPercent } = getProductPricing(product);

  return (
    <div className={`product-price-stack product-price-stack-${size}`}>
      {showLabel ? <span className="product-price-label">Special Price</span> : null}
      <div className="product-price-row">
        <strong className="product-price">{formatRupees(specialPrice)}</strong>
        {hasDisplayMrp ? <span className="product-mrp">{formatRupees(mrp)}</span> : null}
        {hasMrpDiscount ? <span className="product-discount">{discountPercent}% off</span> : null}
      </div>
    </div>
  );
}
