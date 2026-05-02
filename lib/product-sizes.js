export const DEFAULT_PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function normalizeSizeLabel(value = '') {
  return String(value).trim().toUpperCase().replace(/\s+/g, ' ');
}

export function normalizeSizeLabels(values = []) {
  const items = Array.isArray(values) ? values : parseSizeLabelString(values);
  const seen = new Set();

  return items
    .map(normalizeSizeLabel)
    .filter(Boolean)
    .filter((label) => {
      if (seen.has(label)) {
        return false;
      }

      seen.add(label);
      return true;
    });
}

function parseSizeLabelString(value) {
  const text = String(value || '').trim();

  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fall back to comma-separated labels.
  }

  return text.split(',');
}
