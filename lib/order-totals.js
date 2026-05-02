export function calculateLineTax(price, taxPercentage, quantity = 1) {
  return calculateTaxIncludedBreakup(price, taxPercentage, quantity).taxAmount;
}

export function calculateTaxIncludedBreakup(price, taxPercentage, quantity = 1) {
  const grossAmount = roundMoney((Number(price) || 0) * Math.max(0, Number(quantity) || 0));
  const normalizedTaxPercentage = Math.max(0, Number(taxPercentage) || 0);

  if (!grossAmount || !normalizedTaxPercentage) {
    return {
      taxableAmount: grossAmount,
      taxAmount: 0,
      grossAmount,
      taxPercentage: normalizedTaxPercentage
    };
  }

  const taxAmount = roundMoney(grossAmount * (normalizedTaxPercentage / (100 + normalizedTaxPercentage)));

  return {
    taxableAmount: roundMoney(grossAmount - taxAmount),
    taxAmount,
    grossAmount,
    taxPercentage: normalizedTaxPercentage
  };
}

export function calculateCartTotals(items = [], shippingSettings = {}) {
  const itemSubtotal = roundMoney(
    items.reduce((sum, item) => sum + getItemUnitPrice(item) * (Number(item.quantity) || 0), 0)
  );
  const taxableSubtotal = roundMoney(
    items.reduce(
      (sum, item) => sum + calculateTaxIncludedBreakup(getItemUnitPrice(item), item.taxPercentage ?? item.tax_percentage, item.quantity).taxableAmount,
      0
    )
  );
  const taxAmount = roundMoney(
    items.reduce(
      (sum, item) => sum + calculateLineTax(getItemUnitPrice(item), item.taxPercentage ?? item.tax_percentage, item.quantity),
      0
    )
  );
  const shippingFee = calculateShippingFee(itemSubtotal, items.length, shippingSettings);

  return {
    itemSubtotal,
    taxableSubtotal,
    taxAmount,
    shippingFee,
    total: roundMoney(itemSubtotal + shippingFee)
  };
}

export function calculateShippingFee(orderValue, itemCount, shippingSettings = {}) {
  if (!itemCount) {
    return 0;
  }

  const shippingAmount = Math.max(0, Number(shippingSettings.shippingAmount) || 0);
  const freeShippingMinimum = Math.max(0, Number(shippingSettings.freeShippingMinimum) || 0);

  if (freeShippingMinimum > 0 && Number(orderValue) >= freeShippingMinimum) {
    return 0;
  }

  return roundMoney(shippingAmount);
}

export function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function getItemUnitPrice(item = {}) {
  return roundMoney(
    (Number(item.price) || 0) +
      (Array.isArray(item.selectedAddons)
        ? item.selectedAddons.reduce((sum, addon) => sum + Number(addon.price || 0), 0)
        : 0)
  );
}
