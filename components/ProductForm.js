import { useState } from 'react';
import {
  MAX_PRODUCT_IMAGES,
  getProductImageUrlsError,
  isValidProductImageUrl,
  normalizeProductImageUrls
} from '@/lib/product-image-url';
import { normalizeSizeLabels } from '@/lib/product-sizes';

export default function ProductForm({
  mode = 'create',
  initialValues,
  categories,
  sizes = [],
  onSubmit,
  submitLabel
}) {
  const initialImageUrls = normalizeProductImageUrls(initialValues.imageUrls || initialValues.imageUrl || '');
  const [form, setForm] = useState({
    categoryId: initialValues.categoryId || categories[0]?.id || '',
    name: initialValues.name || '',
    sku: initialValues.sku || '',
    slug: initialValues.slug || '',
    description: initialValues.description || '',
    imageUrl: initialImageUrls[0] || '',
    imageUrls: initialImageUrls,
    sizes: normalizeSizeLabels(initialValues.sizes || []),
    mrp: initialValues.mrp ?? initialValues.price ?? '',
    specialPrice: initialValues.specialPrice ?? initialValues.special_price ?? initialValues.price ?? '',
    price: initialValues.specialPrice ?? initialValues.special_price ?? initialValues.price ?? '',
    taxPercentage: initialValues.taxPercentage ?? initialValues.tax_percentage ?? 0,
    stock: initialValues.stock ?? (mode === 'create' ? 0 : ''),
    availabilityType: initialValues.availabilityType || initialValues.availability_type || 'ready_stock',
    readyStockDispatchDays: initialValues.readyStockDispatchDays ?? initialValues.ready_stock_dispatch_days ?? 2,
    makeOrderDispatchDays: initialValues.makeOrderDispatchDays ?? initialValues.make_order_dispatch_days ?? 7
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const imageUrlsError = getProductImageUrlsError(form.imageUrls);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      slug:
        field === 'name' && mode === 'create'
          ? slugify(value)
          : current.slug
    }));
  }

  function updateImageUrls(nextImageUrls) {
    const normalizedImageUrls = normalizeProductImageUrls(nextImageUrls);

    setForm((current) => ({
      ...current,
      imageUrl: normalizedImageUrls[0] || '',
      imageUrls: normalizedImageUrls
    }));
  }

  function updateImageUrl(index, value) {
    const nextImageUrls = [...form.imageUrls];
    nextImageUrls[index] = value;
    updateImageUrls(nextImageUrls);
  }

  function removeImageUrl(index) {
    updateImageUrls(form.imageUrls.filter((_, imageIndex) => imageIndex !== index));
  }

  function addImageUrl() {
    if (form.imageUrls.length >= MAX_PRODUCT_IMAGES) {
      return;
    }

    setForm((current) => ({
      ...current,
      imageUrls: [...current.imageUrls, '']
    }));
  }

  function toggleSize(sizeLabel) {
    setForm((current) => {
      const selected = current.sizes.includes(sizeLabel);

      return {
        ...current,
        sizes: selected
          ? current.sizes.filter((label) => label !== sizeLabel)
          : [...current.sizes, sizeLabel]
      };
    });
  }

  async function handleImageUpload(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const remainingSlots = MAX_PRODUCT_IMAGES - form.imageUrls.length;

    if (remainingSlots <= 0) {
      setUploadError(`Remove an image before adding another. Maximum ${MAX_PRODUCT_IMAGES} images allowed.`);
      event.target.value = '';
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);

    setUploading(true);
    setUploadError('');

    try {
      const uploadedImageUrls = [];

      for (const file of selectedFiles) {
        const body = new FormData();
        body.append('image', file);

        const response = await fetch('/api/products/upload', {
          method: 'POST',
          body
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to upload image.');
        }

        uploadedImageUrls.push(payload.imageUrl);
      }

      updateImageUrls([...form.imageUrls, ...uploadedImageUrls]);

      if (files.length > selectedFiles.length) {
        setUploadError(`Only ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} added. Maximum ${MAX_PRODUCT_IMAGES} images allowed.`);
      }
    } catch (error) {
      setUploadError(error.message || 'Unable to upload image.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  return (
    <form
      onSubmit={(event) => {
        if (imageUrlsError) {
          event.preventDefault();
          return;
        }

        onSubmit(event, form, setForm);
      }}
    >
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Product Name</label>
          <input
            className="form-control"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">SKU</label>
          <input
            className="form-control"
            value={form.sku}
            onChange={(event) => updateField('sku', event.target.value)}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Slug</label>
          <input
            className="form-control"
            value={form.slug}
            onChange={(event) => updateField('slug', event.target.value)}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={form.categoryId}
            onChange={(event) => updateField('categoryId', event.target.value)}
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12">
          <label className="form-label">Product Images</label>
          <div className="product-image-upload">
            <div className="product-image-preview-grid">
              {form.imageUrls.length ? (
                form.imageUrls.map((imageUrl, index) => (
                  <div className="product-image-preview" key={`${imageUrl}-${index}`}>
                    {imageUrl && isValidProductImageUrl(imageUrl) ? (
                      <img src={imageUrl} alt={`${form.name || 'Product'} preview ${index + 1}`} />
                    ) : imageUrl ? (
                      <span>Use a direct image URL</span>
                    ) : (
                      <span>Image {index + 1}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="product-image-preview">
                  <span>No images selected</span>
                </div>
              )}
            </div>
            <div className="product-image-upload-controls">
              <input
                type="file"
                className="form-control"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={handleImageUpload}
                disabled={uploading || form.imageUrls.length >= MAX_PRODUCT_IMAGES}
              />
              {form.imageUrls.map((imageUrl, index) => (
                <div className="product-image-url-row" key={`image-url-${index}`}>
                  <input
                    type="text"
                    inputMode="url"
                    className="form-control"
                    placeholder={`Image ${index + 1} URL`}
                    value={imageUrl}
                    onChange={(event) => updateImageUrl(index, event.target.value)}
                    aria-invalid={Boolean(imageUrlsError)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeImageUrl(index)}
                    aria-label={`Remove image ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {form.imageUrls.length < MAX_PRODUCT_IMAGES ? (
                <button type="button" className="btn btn-outline-dark" onClick={addImageUrl}>
                  Add Image URL
                </button>
              ) : null}
              <div className="form-text">
                {uploading ? 'Uploading images...' : `Upload or paste up to ${MAX_PRODUCT_IMAGES} JPG, PNG, WebP, or GIF images. Max 4 MB each.`}
              </div>
              {imageUrlsError ? <div className="text-danger small">{imageUrlsError}</div> : null}
              {uploadError ? <div className="text-danger small">{uploadError}</div> : null}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <label className="form-label">MRP</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="form-control"
            value={form.mrp}
            onChange={(event) => updateField('mrp', event.target.value)}
            required
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Special Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="form-control"
            value={form.specialPrice}
            onChange={(event) => {
              updateField('specialPrice', event.target.value);
              updateField('price', event.target.value);
            }}
            required
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Tax Percentage</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="form-control"
            value={form.taxPercentage}
            onChange={(event) => updateField('taxPercentage', event.target.value)}
            required
          />
        </div>

        {mode !== 'create' ? (
          <div className="col-md-4">
            <label className="form-label">Ready Stock</label>
            <input
              type="number"
              min="0"
              className="form-control"
              value={form.stock}
              onChange={(event) => updateField('stock', event.target.value)}
              required
            />
          </div>
        ) : null}

        <div className="col-md-4">
          <label className="form-label">Availability</label>
          <select
            className="form-select"
            value={form.availabilityType}
            onChange={(event) => updateField('availabilityType', event.target.value)}
            required
          >
            <option value="ready_stock">In Stock</option>
            <option value="make_order">Make Order</option>
          </select>
        </div>

        {form.availabilityType === 'ready_stock' ? (
          <div className="col-md-4">
            <label className="form-label">Ready Stock Dispatch Days</label>
            <input
              type="number"
              min="1"
              className="form-control"
              value={form.readyStockDispatchDays}
              onChange={(event) => updateField('readyStockDispatchDays', event.target.value)}
              required
            />
          </div>
        ) : (
          <div className="col-md-4">
            <label className="form-label">Make Order Dispatch Days</label>
            <input
              type="number"
              min="1"
              className="form-control"
              value={form.makeOrderDispatchDays}
              onChange={(event) => updateField('makeOrderDispatchDays', event.target.value)}
              required
            />
          </div>
        )}

        <div className="col-12">
          <label className="form-label">Available Sizes</label>
          {sizes.length ? (
            <div className="size-selector-grid">
              {sizes.map((size) => (
                <label className={`size-selector ${form.sizes.includes(size.label) ? 'active' : ''}`} key={size.id || size.label}>
                  <input
                    type="checkbox"
                    checked={form.sizes.includes(size.label)}
                    onChange={() => toggleSize(size.label)}
                  />
                  <span>{size.label}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="form-text mb-0">Create sizes from the Sizes screen before assigning them to products.</p>
          )}
        </div>

        <div className="col-12">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows="5"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </div>
      </div>

      <div className="d-flex justify-content-end mt-4">
        <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={uploading || Boolean(imageUrlsError)}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
