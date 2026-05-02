const IMAGE_EXTENSION_PATTERN = /\.(?:jpe?g|png|webp|gif)$/i;
export const MAX_PRODUCT_IMAGES = 4;

export function normalizeProductImageUrl(value = '') {
  return String(value).trim();
}

export function normalizeProductImageUrls(value = []) {
  const imageUrls = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? parseProductImageUrls(value)
      : [];

  return imageUrls
    .map(normalizeProductImageUrl)
    .filter(Boolean)
    .slice(0, MAX_PRODUCT_IMAGES);
}

function parseProductImageUrls(value) {
  const normalizedValue = normalizeProductImageUrl(value);

  if (!normalizedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(normalizedValue);
    return Array.isArray(parsedValue) ? parsedValue : [normalizedValue];
  } catch {
    return [normalizedValue];
  }
}

export function isValidProductImageUrl(value = '') {
  const imageUrl = normalizeProductImageUrl(value);

  if (!imageUrl) {
    return true;
  }

  if (imageUrl.startsWith('/uploads/products/')) {
    return IMAGE_EXTENSION_PATTERN.test(imageUrl.split(/[?#]/)[0]);
  }

  try {
    const parsedUrl = new URL(imageUrl);
    return (
      ['http:', 'https:'].includes(parsedUrl.protocol) &&
      IMAGE_EXTENSION_PATTERN.test(parsedUrl.pathname)
    );
  } catch {
    return false;
  }
}

export function getProductImageUrlError(value = '') {
  return isValidProductImageUrl(value)
    ? ''
    : 'Use an uploaded image or a direct JPG, PNG, WebP, or GIF image URL.';
}

export function getProductImageUrlsError(value = []) {
  const imageUrls = normalizeProductImageUrls(value);

  if (Array.isArray(value) && value.filter(Boolean).length > MAX_PRODUCT_IMAGES) {
    return `Add up to ${MAX_PRODUCT_IMAGES} product images.`;
  }

  const invalidImageUrl = imageUrls.find((imageUrl) => !isValidProductImageUrl(imageUrl));

  return invalidImageUrl
    ? 'Use uploaded images or direct JPG, PNG, WebP, or GIF image URLs.'
    : '';
}
