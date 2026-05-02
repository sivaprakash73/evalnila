import { productReviewRows, productsPageRows } from '@/lib/dashboard-data';
import {
  getProductImageUrlsError,
  normalizeProductImageUrl,
  normalizeProductImageUrls
} from '@/lib/product-image-url';
import { normalizeSizeLabels } from '@/lib/product-sizes';
import { ensureSizesTable } from '@/lib/server/sizes-service';

let productImageColumnReady = false;
let productImageUrlsColumnReady = false;
let productSizeTablesReady = false;
let productPricingColumnsReady = false;
let productAvailabilityColumnsReady = false;
let productTaxColumnReady = false;
let productSizesBackfillReady = false;

function slugifyValue(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeProduct(product) {
  const reviewMeta = productReviewRows[product.slug] || {};
  const imageUrls = normalizeProductImageUrls(
    product.imageUrls || product.image_urls || product.imageUrl || product.image_url || ''
  );
  const sizes = normalizeProductSizes(product.sizes || product.sizeLabels || product.size_labels || '');
  const specialPrice = Number(product.specialPrice ?? product.special_price ?? product.price ?? 0);
  const mrp = Number(product.mrp ?? specialPrice);
  const availabilityType = product.availabilityType || product.availability_type || (Number(product.stock) > 0 ? 'ready_stock' : 'make_order');
  const readyStockDispatchDays = Number(product.readyStockDispatchDays ?? product.ready_stock_dispatch_days ?? 2);
  const makeOrderDispatchDays = Number(product.makeOrderDispatchDays ?? product.make_order_dispatch_days ?? 7);
  const taxPercentage = Number(product.taxPercentage ?? product.tax_percentage ?? 0);

  return {
    ...product,
    imageUrl: imageUrls[0] || normalizeProductImageUrl(product.imageUrl || product.image_url || ''),
    imageUrls,
    mrp,
    specialPrice,
    price: specialPrice,
    taxPercentage: Number.isFinite(taxPercentage) ? taxPercentage : 0,
    availabilityType,
    availabilityLabel: availabilityType === 'make_order' ? 'Make Order' : 'In Stock',
    readyStockDispatchDays,
    makeOrderDispatchDays,
    dispatchDays: availabilityType === 'make_order' ? makeOrderDispatchDays : readyStockDispatchDays,
    categorySlug:
      product.categorySlug ||
      product.category_slug ||
      slugifyValue(product.category),
    rating: reviewMeta.rating || product.rating || 4.6,
    reviewCount: reviewMeta.reviewCount || product.reviewCount || 48,
    highlights: reviewMeta.highlights || product.highlights || [],
    sizes
  };
}

async function ensureProductTaxColumn(runQuery) {
  if (productTaxColumnReady || !process.env.MYSQL_HOST) {
    return;
  }

  const rows = await runQuery(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME = 'tax_percentage'
    `
  );

  if (!Number(rows[0]?.count)) {
    await runQuery(`ALTER TABLE products ADD COLUMN tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0 AFTER price`);
  }

  productTaxColumnReady = true;
}

async function ensureProductImageColumn(runQuery) {
  if (productImageColumnReady || !process.env.MYSQL_HOST) {
    return;
  }

  const rows = await runQuery(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME = 'image_url'
    `
  );

  if (!Number(rows[0]?.count)) {
    await runQuery(`ALTER TABLE products ADD COLUMN image_url VARCHAR(255) NULL AFTER description`);
  }

  productImageColumnReady = true;
}

async function ensureProductImageUrlsColumn(runQuery) {
  if (productImageUrlsColumnReady || !process.env.MYSQL_HOST) {
    return;
  }

  await ensureProductImageColumn(runQuery);

  const rows = await runQuery(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME = 'image_urls'
    `
  );

  if (!Number(rows[0]?.count)) {
    await runQuery(`ALTER TABLE products ADD COLUMN image_urls JSON NULL AFTER image_url`);
  }

  productImageUrlsColumnReady = true;
}

async function ensureProductSizeTables(runQuery) {
  if (productSizeTablesReady || !process.env.MYSQL_HOST) {
    return;
  }

  await ensureSizesTable(runQuery);
  await runQuery(`
    CREATE TABLE IF NOT EXISTS product_sizes (
      product_id INT NOT NULL,
      size_id INT NOT NULL,
      PRIMARY KEY (product_id, size_id),
      CONSTRAINT fk_product_sizes_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_product_sizes_size
        FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE
    )
  `);

  await backfillProductSizes(runQuery);
  productSizeTablesReady = true;
}

async function backfillProductSizes(runQuery) {
  if (productSizesBackfillReady || !process.env.MYSQL_HOST) {
    return;
  }

  const rows = await runQuery(`SELECT COUNT(*) AS count FROM product_sizes`);

  if (!Number(rows[0]?.count)) {
    await runQuery(`
      INSERT IGNORE INTO product_sizes (product_id, size_id)
      SELECT p.id, s.id
      FROM products p
      INNER JOIN sizes s ON s.label IN ('M', 'L', 'XL')
    `);
  }

  productSizesBackfillReady = true;
}

async function ensureProductPricingColumns(runQuery) {
  if (productPricingColumnsReady || !process.env.MYSQL_HOST) {
    return;
  }

  await ensureProductImageUrlsColumn(runQuery);

  const rows = await runQuery(
    `
      SELECT COLUMN_NAME AS columnName
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME IN ('mrp', 'special_price')
    `
  );
  const existingColumns = new Set(rows.map((row) => row.columnName));

  if (!existingColumns.has('mrp')) {
    await runQuery(`ALTER TABLE products ADD COLUMN mrp DECIMAL(10, 2) NULL AFTER image_urls`);
  }

  if (!existingColumns.has('special_price')) {
    await runQuery(`ALTER TABLE products ADD COLUMN special_price DECIMAL(10, 2) NULL AFTER mrp`);
  }

  await runQuery(`
    UPDATE products
    SET
      special_price = COALESCE(special_price, price),
      mrp = COALESCE(mrp, price)
  `);

  productPricingColumnsReady = true;
}

async function ensureProductAvailabilityColumns(runQuery) {
  if (productAvailabilityColumnsReady || !process.env.MYSQL_HOST) {
    return;
  }

  const rows = await runQuery(
    `
      SELECT COLUMN_NAME AS columnName
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME IN ('availability_type', 'ready_stock_dispatch_days', 'make_order_dispatch_days')
    `
  );
  const existingColumns = new Set(rows.map((row) => row.columnName));

  if (!existingColumns.has('availability_type')) {
    await runQuery(`ALTER TABLE products ADD COLUMN availability_type ENUM('ready_stock', 'make_order') NOT NULL DEFAULT 'ready_stock' AFTER stock`);
  }

  if (!existingColumns.has('ready_stock_dispatch_days')) {
    await runQuery(`ALTER TABLE products ADD COLUMN ready_stock_dispatch_days INT NULL AFTER availability_type`);
  }

  if (!existingColumns.has('make_order_dispatch_days')) {
    await runQuery(`ALTER TABLE products ADD COLUMN make_order_dispatch_days INT NULL AFTER ready_stock_dispatch_days`);
  }

  await runQuery(`
    UPDATE products
    SET
      availability_type = COALESCE(availability_type, CASE WHEN stock > 0 THEN 'ready_stock' ELSE 'make_order' END),
      ready_stock_dispatch_days = COALESCE(ready_stock_dispatch_days, 2),
      make_order_dispatch_days = COALESCE(make_order_dispatch_days, 7)
  `);

  productAvailabilityColumnsReady = true;
}

function getProductReviews(product) {
  return productReviewRows[product.slug]?.reviews || [];
}

function filterProducts(products, { search = '', category = '' } = {}) {
  const normalizedSearch = search.trim().toLowerCase();
  const normalizedCategory = category.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory = !normalizedCategory || product.categorySlug === normalizedCategory;
    const matchesSearch =
      !normalizedSearch ||
      [product.name, product.description, product.sku, product.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch));

    return matchesCategory && matchesSearch;
  });
}

function sortProducts(products, sort = 'latest') {
  const items = [...products];

  switch (sort) {
    case 'price-asc':
      return items.sort((left, right) => Number(left.price) - Number(right.price));
    case 'price-desc':
      return items.sort((left, right) => Number(right.price) - Number(left.price));
    case 'name-asc':
      return items.sort((left, right) => left.name.localeCompare(right.name));
    case 'name-desc':
      return items.sort((left, right) => right.name.localeCompare(left.name));
    case 'latest':
    default:
      return items;
  }
}

function applyPriceRange(products, { minPrice, maxPrice } = {}) {
  const hasMin = Number.isFinite(minPrice);
  const hasMax = Number.isFinite(maxPrice);

  if (!hasMin && !hasMax) {
    return products;
  }

  return products.filter((product) => {
    const price = Number(product.price);
    const matchesMin = !hasMin || price >= minPrice;
    const matchesMax = !hasMax || price <= maxPrice;
    return matchesMin && matchesMax;
  });
}

function parseOptionalPriceFilter(value) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function paginateProducts(products, page = 1, pageSize = 6) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Number(pageSize) || 6);
  const totalItems = products.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(safePage, totalPages);
  const startIndex = (currentPage - 1) * safePageSize;

  return {
    items: products.slice(startIndex, startIndex + safePageSize),
    pagination: {
      page: currentPage,
      pageSize: safePageSize,
      totalItems,
      totalPages,
      startItem: totalItems ? startIndex + 1 : 0,
      endItem: totalItems ? Math.min(startIndex + safePageSize, totalItems) : 0
    }
  };
}

export async function getProducts(runQuery) {
  if (!process.env.MYSQL_HOST) {
    return productsPageRows.map(normalizeProduct);
  }

  await ensureProductImageUrlsColumn(runQuery);
  await ensureProductPricingColumns(runQuery);
  await ensureProductTaxColumn(runQuery);
  await ensureProductAvailabilityColumns(runQuery);
  await ensureProductSizeTables(runQuery);

  const rows = await runQuery(`
    SELECT
      p.id,
      p.category_id AS categoryId,
      p.name,
      p.slug,
      p.sku,
      p.description,
      p.image_url AS imageUrl,
      p.image_urls AS imageUrls,
      p.mrp,
      p.special_price AS specialPrice,
      p.tax_percentage AS taxPercentage,
      c.name AS category,
      c.slug AS categorySlug,
      p.stock,
      p.availability_type AS availabilityType,
      p.ready_stock_dispatch_days AS readyStockDispatchDays,
      p.make_order_dispatch_days AS makeOrderDispatchDays,
      p.price,
      (
        SELECT GROUP_CONCAT(s.label ORDER BY s.sort_order ASC, s.label ASC SEPARATOR ',')
        FROM product_sizes ps
        INNER JOIN sizes s ON s.id = ps.size_id
        WHERE ps.product_id = p.id
      ) AS sizes,
      CASE
        WHEN p.stock = 0 THEN 'Out of Stock'
        WHEN p.stock < 50 THEN 'Low Stock'
        ELSE 'Active'
      END AS status
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    ORDER BY p.created_at DESC
  `);

  return rows.map(normalizeProduct);
}

export async function getProductById(runQuery, id) {
  if (!process.env.MYSQL_HOST) {
    const product = productsPageRows.find((item) => String(item.id) === String(id)) || null;
    return product ? normalizeProduct(product) : null;
  }

  await ensureProductImageUrlsColumn(runQuery);
  await ensureProductPricingColumns(runQuery);
  await ensureProductTaxColumn(runQuery);
  await ensureProductAvailabilityColumns(runQuery);
  await ensureProductSizeTables(runQuery);

  const rows = await runQuery(
    `
      SELECT
        p.id,
        p.category_id AS categoryId,
        p.name,
        p.slug,
        p.sku,
        p.description,
        p.image_url AS imageUrl,
        p.image_urls AS imageUrls,
        p.mrp,
        p.special_price AS specialPrice,
        p.tax_percentage AS taxPercentage,
        c.name AS category,
        c.slug AS categorySlug,
        p.stock,
        p.availability_type AS availabilityType,
        p.ready_stock_dispatch_days AS readyStockDispatchDays,
        p.make_order_dispatch_days AS makeOrderDispatchDays,
        p.price,
        (
          SELECT GROUP_CONCAT(s.label ORDER BY s.sort_order ASC, s.label ASC SEPARATOR ',')
          FROM product_sizes ps
          INNER JOIN sizes s ON s.id = ps.size_id
          WHERE ps.product_id = p.id
        ) AS sizes,
        CASE
          WHEN p.stock = 0 THEN 'Out of Stock'
          WHEN p.stock < 50 THEN 'Low Stock'
          ELSE 'Active'
        END AS status
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows[0] ? normalizeProduct(rows[0]) : null;
}

export async function getProductBySlug(runQuery, slug) {
  if (!process.env.MYSQL_HOST) {
    const product = productsPageRows.find((item) => item.slug === slug) || null;

    if (!product) {
      return null;
    }

    const normalizedProduct = normalizeProduct(product);

    return {
      ...normalizedProduct,
      reviews: getProductReviews(normalizedProduct)
    };
  }

  await ensureProductImageUrlsColumn(runQuery);
  await ensureProductPricingColumns(runQuery);
  await ensureProductTaxColumn(runQuery);
  await ensureProductAvailabilityColumns(runQuery);
  await ensureProductSizeTables(runQuery);

  const rows = await runQuery(
    `
      SELECT
        p.id,
        p.category_id AS categoryId,
        p.name,
        p.slug,
        p.sku,
        p.description,
        p.image_url AS imageUrl,
        p.image_urls AS imageUrls,
        p.mrp,
        p.special_price AS specialPrice,
        p.tax_percentage AS taxPercentage,
        c.name AS category,
        c.slug AS categorySlug,
        p.stock,
        p.availability_type AS availabilityType,
        p.ready_stock_dispatch_days AS readyStockDispatchDays,
        p.make_order_dispatch_days AS makeOrderDispatchDays,
        p.price,
        (
          SELECT GROUP_CONCAT(s.label ORDER BY s.sort_order ASC, s.label ASC SEPARATOR ',')
          FROM product_sizes ps
          INNER JOIN sizes s ON s.id = ps.size_id
          WHERE ps.product_id = p.id
        ) AS sizes,
        CASE
          WHEN p.stock = 0 THEN 'Out of Stock'
          WHEN p.stock < 50 THEN 'Low Stock'
          ELSE 'Active'
        END AS status
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      WHERE p.slug = ?
      LIMIT 1
    `,
    [slug]
  );

  if (!rows[0]) {
    return null;
  }

  const product = normalizeProduct(rows[0]);

  return {
    ...product,
    reviews: getProductReviews(product)
  };
}

export async function getFeaturedProducts(runQuery, limit = 4) {
  const products = await getProducts(runQuery);
  return products.slice(0, limit);
}

export async function getStoreProducts(runQuery, filters = {}) {
  const products = await getProducts(runQuery);
  const minPrice = parseOptionalPriceFilter(filters.minPrice);
  const maxPrice = parseOptionalPriceFilter(filters.maxPrice);
  const filteredProducts = applyPriceRange(filterProducts(products, filters), {
    minPrice,
    maxPrice
  });

  return sortProducts(filteredProducts, filters.sort);
}

export async function getPaginatedStoreProducts(runQuery, filters = {}) {
  const products = await getStoreProducts(runQuery, filters);
  return paginateProducts(products, filters.page, filters.pageSize);
}

export async function getStoreCatalogMeta(runQuery) {
  const products = await getProducts(runQuery);
  const prices = products.map((product) => Number(product.price)).filter((value) => Number.isFinite(value));

  return {
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0
  };
}

export async function getCategoryShowcases(runQuery, limit = 4) {
  const products = await getProducts(runQuery);
  const grouped = new Map();

  products.forEach((product) => {
    const existing = grouped.get(product.categorySlug);

    if (existing) {
      existing.count += 1;
      return;
    }

    grouped.set(product.categorySlug, {
      slug: product.categorySlug,
      name: product.category,
      count: 1,
      sampleProductSlug: product.slug,
      sampleProductName: product.name
    });
  });

  return Array.from(grouped.values())
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, limit);
}

export async function createProduct(runQuery, payload) {
  const {
    categoryId,
    name,
    slug,
    sku,
    description = '',
    imageUrl = '',
    imageUrls = [],
    sizes = [],
    mrp,
    specialPrice,
    price,
    taxPercentage = 0,
    stock,
    availabilityType = 'ready_stock',
    readyStockDispatchDays,
    makeOrderDispatchDays
  } = payload;

  if (!categoryId || !name || !slug || !sku) {
    throw new Error('Category, name, slug, and SKU are required.');
  }

  const normalizedSpecialPrice = Number(specialPrice ?? price);
  const normalizedMrp = Number(mrp ?? normalizedSpecialPrice);
  const normalizedTaxPercentage = Number(taxPercentage ?? 0);

  if (
    !Number.isFinite(normalizedMrp) ||
    !Number.isFinite(normalizedSpecialPrice) ||
    !Number.isFinite(normalizedTaxPercentage) ||
    !Number.isFinite(Number(stock))
  ) {
    throw new Error('MRP, special price, tax percentage, and stock must be valid numbers.');
  }

  if (normalizedMrp < normalizedSpecialPrice) {
    throw new Error('MRP must be greater than or equal to special price.');
  }

  if (normalizedTaxPercentage < 0) {
    throw new Error('Tax percentage must be zero or more.');
  }

  const normalizedAvailabilityType = availabilityType === 'make_order' ? 'make_order' : 'ready_stock';
  const normalizedReadyStockDispatchDays = Math.max(1, Number(readyStockDispatchDays) || 2);
  const normalizedMakeOrderDispatchDays = Math.max(1, Number(makeOrderDispatchDays) || 7);

  const normalizedImageUrls = normalizeProductImageUrls(
    hasProductImageUrls(imageUrls) ? imageUrls : imageUrl
  );
  const normalizedImageUrl = normalizedImageUrls[0] || '';
  const imageUrlError = getProductImageUrlsError(normalizedImageUrls);
  const normalizedSizes = normalizeSizeLabels(sizes);

  if (imageUrlError) {
    throw new Error(imageUrlError);
  }

  if (!process.env.MYSQL_HOST) {
    return {
      id: Date.now(),
      categoryId: Number(categoryId),
      name,
      slug,
      sku,
      description,
      imageUrl: normalizedImageUrl,
      imageUrls: normalizedImageUrls,
      sizes: normalizedSizes,
      mrp: normalizedMrp,
      specialPrice: normalizedSpecialPrice,
      price: normalizedSpecialPrice,
      taxPercentage: normalizedTaxPercentage,
      availabilityType: normalizedAvailabilityType,
      availabilityLabel: normalizedAvailabilityType === 'make_order' ? 'Make Order' : 'In Stock',
      readyStockDispatchDays: normalizedReadyStockDispatchDays,
      makeOrderDispatchDays: normalizedMakeOrderDispatchDays,
      dispatchDays: normalizedAvailabilityType === 'make_order' ? normalizedMakeOrderDispatchDays : normalizedReadyStockDispatchDays,
      stock: Number(stock),
      status: 'Active'
    };
  }

  await ensureProductImageUrlsColumn(runQuery);
  await ensureProductPricingColumns(runQuery);
  await ensureProductTaxColumn(runQuery);
  await ensureProductAvailabilityColumns(runQuery);
  await ensureProductSizeTables(runQuery);

  const result = await runQuery(
    `
      INSERT INTO products (
        category_id,
        name,
        slug,
        sku,
        description,
        image_url,
        image_urls,
        mrp,
        special_price,
        price,
        tax_percentage,
        stock,
        availability_type,
        ready_stock_dispatch_days,
        make_order_dispatch_days,
        revenue,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'active')
    `,
    [
      Number(categoryId),
      name,
      slug,
      sku,
      description,
      normalizedImageUrl || null,
      normalizedImageUrls.length ? JSON.stringify(normalizedImageUrls) : null,
      normalizedMrp,
      normalizedSpecialPrice,
      normalizedSpecialPrice,
      normalizedTaxPercentage,
      Number(stock),
      normalizedAvailabilityType,
      normalizedReadyStockDispatchDays,
      normalizedMakeOrderDispatchDays
    ]
  );

  const productId = result.insertId;
  await saveProductSizes(runQuery, productId, normalizedSizes);

  return {
    id: productId,
    categoryId: Number(categoryId),
    name,
    slug,
    sku,
    description,
    imageUrl: normalizedImageUrl,
    imageUrls: normalizedImageUrls,
    sizes: normalizedSizes,
    mrp: normalizedMrp,
    specialPrice: normalizedSpecialPrice,
    price: normalizedSpecialPrice,
    taxPercentage: normalizedTaxPercentage,
    availabilityType: normalizedAvailabilityType,
    availabilityLabel: normalizedAvailabilityType === 'make_order' ? 'Make Order' : 'In Stock',
    readyStockDispatchDays: normalizedReadyStockDispatchDays,
    makeOrderDispatchDays: normalizedMakeOrderDispatchDays,
    dispatchDays: normalizedAvailabilityType === 'make_order' ? normalizedMakeOrderDispatchDays : normalizedReadyStockDispatchDays,
    stock: Number(stock)
  };
}

export async function updateProduct(runQuery, id, payload) {
  const {
    categoryId,
    name,
    slug,
    sku,
    description = '',
    imageUrl = '',
    imageUrls = [],
    sizes = [],
    mrp,
    specialPrice,
    price,
    taxPercentage = 0,
    stock,
    availabilityType = 'ready_stock',
    readyStockDispatchDays,
    makeOrderDispatchDays
  } = payload;

  if (!categoryId || !name || !slug || !sku) {
    throw new Error('Category, name, slug, and SKU are required.');
  }

  const normalizedSpecialPrice = Number(specialPrice ?? price);
  const normalizedMrp = Number(mrp ?? normalizedSpecialPrice);
  const normalizedTaxPercentage = Number(taxPercentage ?? 0);

  if (
    !Number.isFinite(normalizedMrp) ||
    !Number.isFinite(normalizedSpecialPrice) ||
    !Number.isFinite(normalizedTaxPercentage) ||
    !Number.isFinite(Number(stock))
  ) {
    throw new Error('MRP, special price, tax percentage, and stock must be valid numbers.');
  }

  if (normalizedMrp < normalizedSpecialPrice) {
    throw new Error('MRP must be greater than or equal to special price.');
  }

  if (normalizedTaxPercentage < 0) {
    throw new Error('Tax percentage must be zero or more.');
  }

  const normalizedAvailabilityType = availabilityType === 'make_order' ? 'make_order' : 'ready_stock';
  const normalizedReadyStockDispatchDays = Math.max(1, Number(readyStockDispatchDays) || 2);
  const normalizedMakeOrderDispatchDays = Math.max(1, Number(makeOrderDispatchDays) || 7);

  const normalizedImageUrls = normalizeProductImageUrls(
    hasProductImageUrls(imageUrls) ? imageUrls : imageUrl
  );
  const normalizedImageUrl = normalizedImageUrls[0] || '';
  const imageUrlError = getProductImageUrlsError(normalizedImageUrls);
  const normalizedSizes = normalizeSizeLabels(sizes);

  if (imageUrlError) {
    throw new Error(imageUrlError);
  }

  if (!process.env.MYSQL_HOST) {
    return {
      id: Number(id),
      categoryId: Number(categoryId),
      name,
      slug,
      sku,
      description,
      imageUrl: normalizedImageUrl,
      imageUrls: normalizedImageUrls,
      sizes: normalizedSizes,
      mrp: normalizedMrp,
      specialPrice: normalizedSpecialPrice,
      price: normalizedSpecialPrice,
      taxPercentage: normalizedTaxPercentage,
      availabilityType: normalizedAvailabilityType,
      availabilityLabel: normalizedAvailabilityType === 'make_order' ? 'Make Order' : 'In Stock',
      readyStockDispatchDays: normalizedReadyStockDispatchDays,
      makeOrderDispatchDays: normalizedMakeOrderDispatchDays,
      dispatchDays: normalizedAvailabilityType === 'make_order' ? normalizedMakeOrderDispatchDays : normalizedReadyStockDispatchDays,
      stock: Number(stock)
    };
  }

  await ensureProductImageUrlsColumn(runQuery);
  await ensureProductPricingColumns(runQuery);
  await ensureProductTaxColumn(runQuery);
  await ensureProductAvailabilityColumns(runQuery);
  await ensureProductSizeTables(runQuery);

  await runQuery(
    `
      UPDATE products
      SET category_id = ?, name = ?, slug = ?, sku = ?, description = ?, image_url = ?, image_urls = ?, mrp = ?, special_price = ?, price = ?, tax_percentage = ?, stock = ?, availability_type = ?, ready_stock_dispatch_days = ?, make_order_dispatch_days = ?
      WHERE id = ?
    `,
    [
      Number(categoryId),
      name,
      slug,
      sku,
      description,
      normalizedImageUrl || null,
      normalizedImageUrls.length ? JSON.stringify(normalizedImageUrls) : null,
      normalizedMrp,
      normalizedSpecialPrice,
      normalizedSpecialPrice,
      normalizedTaxPercentage,
      Number(stock),
      normalizedAvailabilityType,
      normalizedReadyStockDispatchDays,
      normalizedMakeOrderDispatchDays,
      Number(id)
    ]
  );
  await saveProductSizes(runQuery, Number(id), normalizedSizes);

  return getProductById(runQuery, id);
}

export async function deleteProduct(runQuery, id) {
  if (!process.env.MYSQL_HOST) {
    return { deleted: true };
  }

  await runQuery(`DELETE FROM products WHERE id = ?`, [Number(id)]);
  return { deleted: true };
}

function hasProductImageUrls(value) {
  return Array.isArray(value)
    ? value.some(Boolean)
    : typeof value === 'string' && Boolean(normalizeProductImageUrl(value));
}

function normalizeProductSizes(value) {
  if (Array.isArray(value)) {
    return normalizeSizeLabels(value.map((item) => (typeof item === 'string' ? item : item?.label)));
  }

  return normalizeSizeLabels(value);
}

async function saveProductSizes(runQuery, productId, sizes) {
  await runQuery(`DELETE FROM product_sizes WHERE product_id = ?`, [productId]);

  if (!sizes.length) {
    return;
  }

  const rows = await runQuery(`SELECT id, label FROM sizes`);
  const idsByLabel = new Map(rows.filter((row) => sizes.includes(row.label)).map((row) => [row.label, row.id]));

  for (const label of sizes) {
    const sizeId = idsByLabel.get(label);

    if (sizeId) {
      await runQuery(
        `
          INSERT IGNORE INTO product_sizes (product_id, size_id)
          VALUES (?, ?)
        `,
        [productId, sizeId]
      );
    }
  }
}
