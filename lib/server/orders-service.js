import { ordersPageRows } from '@/lib/dashboard-data';
import { productsPageRows } from '@/lib/dashboard-data';
import { calculateCartTotals } from '@/lib/order-totals';
import { getShippingSettings } from '@/lib/server/shipping-service';
import { ensureSizesTable } from '@/lib/server/sizes-service';
import { ensureAddonsTables } from '@/lib/server/addons-service';

const mockCreatedOrders = [];
let orderItemSizeColumnReady = false;
let orderItemNotesColumnReady = false;
let orderProductSizeTablesReady = false;
let orderTaxColumnReady = false;
let orderProductTaxColumnReady = false;

export async function getOrders(runQuery) {
  if (!process.env.MYSQL_HOST) {
    return [...mockCreatedOrders, ...ordersPageRows];
  }

  return runQuery(`
    SELECT
      o.id,
      o.order_number AS orderNumber,
      o.customer_id AS customerId,
      CONCAT(c.first_name, ' ', c.last_name) AS customer,
      DATE_FORMAT(o.order_date, '%Y-%m-%d') AS orderDate,
      o.payment_status AS paymentStatus,
      o.status,
      o.total_amount AS amount
    FROM orders o
    INNER JOIN customers c ON c.id = o.customer_id
    ORDER BY o.order_date DESC
    LIMIT 20
  `);
}

export async function getOrderById(runQuery, id) {
  if (!process.env.MYSQL_HOST) {
    const order = [...mockCreatedOrders, ...ordersPageRows].find((item) => String(item.id) === String(id));

    if (!order) {
      return null;
    }

    return {
      ...order,
      address: order.address || '',
      taxAmount: order.taxAmount ?? 0,
      shippingFee: order.shippingFee ?? (order.amount > 1000 ? 20 : 15),
      subtotal: order.subtotal ?? (order.amount > 1000 ? order.amount - 20 : order.amount - 15),
      items: order.items || buildMockOrderItems(order.id)
    };
  }

  await ensureOrderItemSizeColumn(runQuery);
  await ensureOrderItemNotesColumn(runQuery);
  await ensureOrderTaxColumn(runQuery);
  await ensureOrderProductTaxColumn(runQuery);
  await ensureAddonsTables(runQuery);
  await ensureOrderProductSizeTables(runQuery);

  const orderRows = await runQuery(
    `
      SELECT
        o.id,
        o.order_number AS orderNumber,
        o.customer_id AS customerId,
        CONCAT(c.first_name, ' ', c.last_name) AS customer,
        c.email,
        c.phone,
        c.address_line AS address,
        c.city,
        c.country,
        CONCAT(c.city, ', ', c.country) AS location,
        DATE_FORMAT(o.order_date, '%Y-%m-%d') AS orderDate,
        o.payment_status AS paymentStatus,
        o.status,
        o.subtotal,
        o.tax_amount AS taxAmount,
        o.shipping_fee AS shippingFee,
        o.total_amount AS amount
      FROM orders o
      INNER JOIN customers c ON c.id = o.customer_id
      WHERE o.id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  const order = orderRows[0];

  if (!order) {
    return null;
  }

  const items = await runQuery(
    `
      SELECT
        oi.id,
        p.name,
        p.sku,
        oi.quantity,
        oi.selected_size AS selectedSize,
        oi.item_notes AS itemNotes,
        oi.unit_price AS unitPrice,
        oi.line_total AS lineTotal
      FROM order_items oi
      INNER JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `,
    [Number(id)]
  );

  return {
    ...order,
    items
  };
}

export async function getOrderByNumber(runQuery, orderNumber) {
  if (!process.env.MYSQL_HOST) {
    const order = [...mockCreatedOrders, ...ordersPageRows].find(
      (item) => String(item.orderNumber).toLowerCase() === String(orderNumber).toLowerCase()
    );

    if (!order) {
      return null;
    }

    return getOrderById(runQuery, order.id);
  }

  const rows = await runQuery(
    `
      SELECT id
      FROM orders
      WHERE order_number = ?
      LIMIT 1
    `,
    [orderNumber]
  );

  if (!rows[0]) {
    return null;
  }

  return getOrderById(runQuery, rows[0].id);
}

export async function updateOrderStatus(runQuery, id, payload) {
  const { status, paymentStatus } = payload;

  if (!status || !paymentStatus) {
    throw new Error('Status and payment status are required.');
  }

  if (!process.env.MYSQL_HOST) {
    return { id: Number(id), status, paymentStatus };
  }

  await runQuery(
    `
      UPDATE orders
      SET status = ?, payment_status = ?
      WHERE id = ?
    `,
    [status, paymentStatus, Number(id)]
  );

  const rows = await runQuery(
    `
      SELECT
        o.id,
        o.order_number AS orderNumber,
        CONCAT(c.first_name, ' ', c.last_name) AS customer,
        DATE_FORMAT(o.order_date, '%Y-%m-%d') AS orderDate,
        o.payment_status AS paymentStatus,
        o.status,
        o.total_amount AS amount
      FROM orders o
      INNER JOIN customers c ON c.id = o.customer_id
      WHERE o.id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows[0] || null;
}

export async function createStoreOrder(runQuery, payload, pool) {
  const {
    customer,
    items,
    paymentMethod = 'cod',
    paymentStatus = null,
    status = 'Pending',
    paymentGateway = null,
    paymentGatewayOrderId = null,
    paymentGatewayPaymentId = null,
    paymentGatewaySignature = null
  } = payload || {};

  const initialPaymentStatus = paymentStatus || deriveInitialPaymentStatus(paymentMethod);

  validateStoreOrderPayload(customer, items);

  if (!process.env.MYSQL_HOST) {
    const preparedItems = prepareMockOrderItems(items);
    const totals = calculateCartTotals(
      preparedItems.map((item) => ({
        price: item.unitPrice,
        taxPercentage: item.taxPercentage,
        quantity: item.quantity
      })),
      await getShippingSettings(runQuery)
    );
    const subtotal = totals.itemSubtotal;
    const amount = totals.total;
    const existingOrder = paymentGatewayOrderId
      ? mockCreatedOrders.find((item) => item.paymentGatewayOrderId === paymentGatewayOrderId) || null
      : null;

    if (existingOrder) {
      return existingOrder;
    }

    const orderId = mockCreatedOrders.length + ordersPageRows.length + 1;
    const orderNumber = createOrderNumber();
    const mockOrder = {
      id: orderId,
      customerId: orderId,
      orderNumber,
      customer: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city,
      country: customer.country,
      location: `${customer.city}, ${customer.country}`,
      orderDate: new Date().toISOString().slice(0, 10),
      paymentStatus: initialPaymentStatus,
      paymentMethod,
      paymentGateway,
      paymentGatewayOrderId,
      paymentGatewayPaymentId,
      paymentGatewaySignature,
      status,
      subtotal,
      taxAmount: totals.taxAmount,
      shippingFee: totals.shippingFee,
      amount,
      items: preparedItems.map((item, index) => ({
        id: orderId * 10 + index,
        name: item.name,
        sku: item.sku,
        selectedSize: item.selectedSize || null,
        itemNotes: item.itemNotes || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxPercentage: item.taxPercentage,
        lineTotal: item.lineTotal
      }))
    };

    mockCreatedOrders.unshift(mockOrder);
    return mockOrder;
  }

  if (paymentGatewayOrderId) {
    const existingOrder = await getOrderByGatewayOrderId(runQuery, paymentGatewayOrderId);

    if (existingOrder) {
      return existingOrder;
    }
  }

  await ensureOrderItemSizeColumn(runQuery);
  await ensureOrderItemNotesColumn(runQuery);
  await ensureOrderTaxColumn(runQuery);
  await ensureOrderProductTaxColumn(runQuery);
  await ensureAddonsTables(runQuery);
  await ensureOrderProductSizeTables(runQuery);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let customerId;
    const existingCustomerRows = await connection.execute(
      `
        SELECT id
        FROM customers
        WHERE email = ?
        LIMIT 1
      `,
      [customer.email]
    );
    const existingCustomer = existingCustomerRows[0][0];

    if (existingCustomer) {
      customerId = existingCustomer.id;
      await connection.execute(
        `
          UPDATE customers
          SET
            first_name = ?,
            last_name = ?,
            phone = ?,
            address_line = ?,
            city = ?,
            country = ?
          WHERE id = ?
        `,
        [
          customer.firstName,
          customer.lastName,
          customer.phone || '',
          customer.address || '',
          customer.city,
          customer.country,
          customerId
        ]
      );
    } else {
      const insertedCustomer = await connection.execute(
        `
          INSERT INTO customers (
            first_name,
            last_name,
            email,
            phone,
            address_line,
            city,
            country
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          customer.firstName,
          customer.lastName,
          customer.email,
          customer.phone || '',
          customer.address || '',
          customer.city,
          customer.country
        ]
      );
      customerId = insertedCustomer[0].insertId;
    }

    const preparedItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      const productId = Number(item.id);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Each cart item must have a valid quantity.');
      }

      const productRows = await connection.execute(
        `
          SELECT
            p.id,
            p.name,
            p.sku,
            p.price,
            p.tax_percentage AS taxPercentage,
            p.stock,
            (
              SELECT GROUP_CONCAT(s.label ORDER BY s.sort_order ASC, s.label ASC SEPARATOR ',')
              FROM product_sizes ps
              INNER JOIN sizes s ON s.id = ps.size_id
              WHERE ps.product_id = p.id
            ) AS sizes
          FROM products
          p
          WHERE id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [productId]
      );
      const product = productRows[0][0];

      if (!product) {
        throw new Error('One or more products are no longer available.');
      }

      if (Number(product.stock) < quantity) {
        throw new Error(`${product.name} does not have enough stock.`);
      }

      const availableSizes = parseSizeList(product.sizes);
      const selectedSize = normalizeSelectedSize(item.selectedSize);
      const selectedAddons = await getSelectedProductAddons(connection, product.id, item.selectedAddons);
      const itemNotes = normalizeItemNotes(item.itemNotes);
      const addonTotal = selectedAddons.reduce((sum, addon) => sum + Number(addon.price || 0), 0);
      const unitPrice = Number(product.price) + addonTotal;

      if (availableSizes.length && !selectedSize) {
        throw new Error(`Select a size for ${product.name}.`);
      }

      if (selectedSize && !availableSizes.includes(selectedSize)) {
        throw new Error(`${selectedSize} is not available for ${product.name}.`);
      }

      preparedItems.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        selectedSize: selectedSize || null,
        itemNotes: buildItemNotesWithAddons(itemNotes, selectedAddons),
        quantity,
        unitPrice,
        taxPercentage: Number(product.taxPercentage || 0),
        lineTotal: unitPrice * quantity
      });
    }

    const totals = calculateCartTotals(
      preparedItems.map((item) => ({
        price: item.unitPrice,
        taxPercentage: item.taxPercentage,
        quantity: item.quantity
      })),
      await getShippingSettings(runQuery)
    );
    const subtotal = totals.itemSubtotal;
    const orderNumber = createOrderNumber();
    const totalAmount = totals.total;

    const insertedOrder = await connection.execute(
      `
        INSERT INTO orders (
          customer_id,
          order_number,
          order_date,
          status,
          payment_status,
          payment_method,
          payment_gateway,
          payment_gateway_order_id,
          payment_gateway_payment_id,
          payment_gateway_signature,
          subtotal,
          tax_amount,
          shipping_fee,
          total_amount
        )
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        customerId,
        orderNumber,
        status,
        initialPaymentStatus,
        paymentMethod,
        paymentGateway,
        paymentGatewayOrderId,
        paymentGatewayPaymentId,
        paymentGatewaySignature,
        subtotal,
        totals.taxAmount,
        totals.shippingFee,
        totalAmount
      ]
    );

    const orderId = insertedOrder[0].insertId;

    for (const item of preparedItems) {
      await connection.execute(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            selected_size,
            item_notes,
            unit_price,
            line_total
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [orderId, item.id, item.quantity, item.selectedSize, item.itemNotes, item.unitPrice, item.lineTotal]
      );

      await connection.execute(
        `
          UPDATE products
          SET
            stock = stock - ?,
            revenue = revenue + ?
          WHERE id = ?
        `,
        [item.quantity, item.lineTotal, item.id]
      );
    }

    await connection.commit();
    return getOrderById(runQuery, orderId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getStoreOrderEstimate(runQuery, items = []) {
  if (!Array.isArray(items) || !items.length) {
    return calculateCartTotals([], await getShippingSettings(runQuery));
  }

  if (!process.env.MYSQL_HOST) {
    const preparedItems = prepareMockOrderItems(items);
    return calculateCartTotals(
      preparedItems.map((item) => ({
        price: item.unitPrice,
        taxPercentage: item.taxPercentage,
        quantity: item.quantity
      })),
      await getShippingSettings(runQuery)
    );
  }

  await ensureOrderProductTaxColumn(runQuery);
  await ensureAddonsTables(runQuery);

  const estimateItems = [];

  for (const item of items) {
    const quantity = Number(item.quantity);
    const productId = Number(item.id);

    if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isInteger(productId)) {
      throw new Error('Each cart item must have a valid product and quantity.');
    }

    const productRows = await runQuery(
      `
        SELECT price, tax_percentage AS taxPercentage
        FROM products
        WHERE id = ?
        LIMIT 1
      `,
      [productId]
    );
    const product = productRows[0];

    if (!product) {
      throw new Error('One or more products are no longer available.');
    }

    const selectedAddons = await getSelectedProductAddons({ execute: (sql, params) => runQuery(sql, params).then((rows) => [rows]) }, productId, item.selectedAddons);
    const addonTotal = selectedAddons.reduce((sum, addon) => sum + Number(addon.price || 0), 0);

    estimateItems.push({
      price: Number(product.price) + addonTotal,
      taxPercentage: Number(product.taxPercentage || 0),
      quantity
    });
  }

  return calculateCartTotals(estimateItems, await getShippingSettings(runQuery));
}

export async function getOrderByGatewayOrderId(runQuery, gatewayOrderId) {
  if (!gatewayOrderId) {
    return null;
  }

  if (!process.env.MYSQL_HOST) {
    const order = mockCreatedOrders.find((item) => item.paymentGatewayOrderId === gatewayOrderId) || null;
    return order ? getOrderById(runQuery, order.id) : null;
  }

  const rows = await runQuery(
    `
      SELECT id
      FROM orders
      WHERE payment_gateway_order_id = ?
      LIMIT 1
    `,
    [gatewayOrderId]
  );

  if (!rows[0]) {
    return null;
  }

  return getOrderById(runQuery, rows[0].id);
}

export async function updateOrderPaymentByGatewayOrderId(runQuery, gatewayOrderId, updates) {
  const {
    paymentStatus,
    status = 'Pending',
    paymentGatewayPaymentId = null,
    paymentGatewaySignature = null
  } = updates;

  if (!gatewayOrderId || !paymentStatus) {
    throw new Error('Gateway order id and payment status are required.');
  }

  if (!process.env.MYSQL_HOST) {
    const target = mockCreatedOrders.find((item) => item.paymentGatewayOrderId === gatewayOrderId);

    if (!target) {
      return null;
    }

    target.paymentStatus = paymentStatus;
    target.status = status;
    target.paymentGatewayPaymentId = paymentGatewayPaymentId || target.paymentGatewayPaymentId;
    target.paymentGatewaySignature = paymentGatewaySignature || target.paymentGatewaySignature;
    return target;
  }

  await runQuery(
    `
      UPDATE orders
      SET
        payment_status = ?,
        status = ?,
        payment_gateway_payment_id = COALESCE(?, payment_gateway_payment_id),
        payment_gateway_signature = COALESCE(?, payment_gateway_signature)
      WHERE payment_gateway_order_id = ?
    `,
    [
      paymentStatus,
      status,
      paymentGatewayPaymentId,
      paymentGatewaySignature,
      gatewayOrderId
    ]
  );

  const rows = await runQuery(
    `
      SELECT id
      FROM orders
      WHERE payment_gateway_order_id = ?
      LIMIT 1
    `,
    [gatewayOrderId]
  );

  if (!rows[0]) {
    return null;
  }

  return getOrderById(runQuery, rows[0].id);
}

function validateStoreOrderPayload(customer, items) {
  if (!customer) {
    throw new Error('Customer details are required.');
  }

  const requiredCustomerFields = ['firstName', 'lastName', 'email', 'address', 'city', 'country'];

  for (const field of requiredCustomerFields) {
    if (!customer[field]) {
      throw new Error(`Missing customer field: ${field}`);
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('At least one cart item is required.');
  }

  for (const item of items) {
    if (!item?.id) {
      throw new Error('Each cart item must include a product id.');
    }
  }
}

async function ensureOrderItemSizeColumn(runQuery) {
  if (orderItemSizeColumnReady || !process.env.MYSQL_HOST) {
    return;
  }

  const rows = await runQuery(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'order_items'
        AND COLUMN_NAME = 'selected_size'
    `
  );

  if (!Number(rows[0]?.count)) {
    await runQuery(`ALTER TABLE order_items ADD COLUMN selected_size VARCHAR(40) NULL AFTER quantity`);
  }

  orderItemSizeColumnReady = true;
}

async function ensureOrderItemNotesColumn(runQuery) {
  if (orderItemNotesColumnReady || !process.env.MYSQL_HOST) {
    return;
  }

  const rows = await runQuery(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'order_items'
        AND COLUMN_NAME = 'item_notes'
    `
  );

  if (!Number(rows[0]?.count)) {
    await runQuery(`ALTER TABLE order_items ADD COLUMN item_notes VARCHAR(500) NULL AFTER selected_size`);
  }

  orderItemNotesColumnReady = true;
}

async function ensureOrderTaxColumn(runQuery) {
  if (orderTaxColumnReady || !process.env.MYSQL_HOST) {
    return;
  }

  const rows = await runQuery(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'tax_amount'
    `
  );

  if (!Number(rows[0]?.count)) {
    await runQuery(`ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER subtotal`);
  }

  orderTaxColumnReady = true;
}

async function ensureOrderProductTaxColumn(runQuery) {
  if (orderProductTaxColumnReady || !process.env.MYSQL_HOST) {
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

  orderProductTaxColumnReady = true;
}

async function ensureOrderProductSizeTables(runQuery) {
  if (orderProductSizeTablesReady || !process.env.MYSQL_HOST) {
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

  orderProductSizeTablesReady = true;
}

function deriveInitialPaymentStatus(paymentMethod) {
  if (paymentMethod === 'razorpay') {
    return 'Paid';
  }

  if (paymentMethod === 'cod') {
    return 'Pending';
  }

  return 'Pending';
}

function createOrderNumber() {
  const stamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `ORD-${stamp}${random}`;
}

function buildMockOrderItems(id) {
  const itemsByOrderId = {
    1: [
      { id: 1, name: 'Custom Kurti Set', sku: 'EV-KU-001', quantity: 2, unitPrice: 1200, lineTotal: 2400 },
      { id: 2, name: 'Tailored Co-ord Set', sku: 'EV-CO-003', quantity: 1, unitPrice: 2200, lineTotal: 2200 }
    ],
    2: [
      { id: 3, name: 'Elegant Maxi Dress', sku: 'EV-MA-002', quantity: 1, unitPrice: 1800, lineTotal: 1800 },
      { id: 4, name: 'Crop-Skirt Occasion Set', sku: 'EV-CS-004', quantity: 1, unitPrice: 2500, lineTotal: 2500 }
    ],
    3: [
      { id: 5, name: 'Saree Styling Blouse', sku: 'EV-SA-006', quantity: 1, unitPrice: 1500, lineTotal: 1500 }
    ],
    4: [
      { id: 6, name: 'Western Wear Dress', sku: 'EV-WW-005', quantity: 1, unitPrice: 2000, lineTotal: 2000 }
    ]
  };

  return itemsByOrderId[id] || [];
}

function prepareMockOrderItems(items) {
  return items.map((item) => {
    const product = productsPageRows.find((productItem) => String(productItem.id) === String(item.id));
    const quantity = Number(item.quantity);

    if (!product) {
      throw new Error('One or more products are no longer available.');
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Each cart item must have a valid quantity.');
    }

    if (Number(product.stock) < quantity) {
      throw new Error(`${product.name} does not have enough stock.`);
    }

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      selectedSize: normalizeSelectedSize(item.selectedSize) || null,
      itemNotes: normalizeItemNotes(item.itemNotes),
      quantity,
      unitPrice: Number(product.price),
      taxPercentage: Number(product.taxPercentage || 0),
      lineTotal: Number(product.price) * quantity
    };
  });
}

function parseSizeList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function normalizeSelectedSize(value) {
  return String(value || '').trim().toUpperCase() || null;
}

function normalizeItemNotes(value) {
  const notes = String(value || '').trim();

  return notes ? notes.slice(0, 500) : null;
}

function normalizeSelectedAddonIds(addons = []) {
  return Array.isArray(addons)
    ? [...new Set(addons.map((addon) => Number(addon?.id)).filter((id) => Number.isInteger(id) && id > 0))]
    : [];
}

async function getSelectedProductAddons(connection, productId, selectedAddons = []) {
  const addonIds = normalizeSelectedAddonIds(selectedAddons);

  if (!addonIds.length) {
    return [];
  }

  const placeholders = addonIds.map(() => '?').join(', ');
  const rows = await connection.execute(
    `
      SELECT a.id, a.name, a.price
      FROM product_addons pa
      INNER JOIN addons a ON a.id = pa.addon_id
      WHERE pa.product_id = ? AND a.is_active = 1 AND a.id IN (${placeholders})
    `,
    [Number(productId), ...addonIds]
  );
  const addons = rows[0];

  if (addons.length !== addonIds.length) {
    throw new Error('One or more selected add-ons are no longer available.');
  }

  return addons.map((addon) => ({
    id: addon.id,
    name: addon.name,
    price: Number(addon.price || 0)
  }));
}

function buildItemNotesWithAddons(notes, addons = []) {
  const addonText = addons.length
    ? `Add-ons: ${addons.map((addon) => `${addon.name} (+ Rs. ${Number(addon.price || 0).toFixed(2)})`).join(', ')}`
    : '';

  return [notes, addonText].filter(Boolean).join(' | ').slice(0, 500) || null;
}
