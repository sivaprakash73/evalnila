export function formatRupees(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

export function getProductPricing(product = {}) {
  const specialPrice = Number(product.specialPrice ?? product.special_price ?? product.price ?? 0);
  const mrp = Number(product.mrp ?? 0);
  const hasMrpDiscount = Number.isFinite(mrp) && mrp > specialPrice;
  const hasDisplayMrp = Number.isFinite(mrp) && mrp > 0 && mrp >= specialPrice;

  return {
    mrp,
    specialPrice,
    hasDisplayMrp,
    hasMrpDiscount,
    discountPercent: hasMrpDiscount ? Math.round(((mrp - specialPrice) / mrp) * 100) : 0
  };
}
