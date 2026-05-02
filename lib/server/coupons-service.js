const mockCoupons = [
  {
    id: 1,
    code: 'WELCOME10',
    type: 'percentage',
    discountValue: 10,
    minimumOrderAmount: 500,
    usageLimit: 250,
    usedCount: 42,
    startsAt: '2026-04-01',
    endsAt: '2026-05-31',
    isActive: true
  },
  {
    id: 2,
    code: 'FREESHIP',
    type: 'fixed',
    discountValue: 99,
    minimumOrderAmount: 999,
    usageLimit: 150,
    usedCount: 64,
    startsAt: '2026-04-15',
    endsAt: '2026-06-15',
    isActive: true
  }
];

let couponsTableReady = false;

async function ensureCouponsTable(runQuery) {
  if (couponsTableReady || !process.env.MYSQL_HOST) {
    return;
  }

  await runQuery(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(40) NOT NULL UNIQUE,
      type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
      discount_value DECIMAL(10, 2) NOT NULL,
      minimum_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      usage_limit INT,
      used_count INT NOT NULL DEFAULT 0,
      starts_at DATE,
      ends_at DATE,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  couponsTableReady = true;
}

export async function getCoupons(runQuery) {
  if (!process.env.MYSQL_HOST) {
    return mockCoupons;
  }

  await ensureCouponsTable(runQuery);

  return runQuery(`
    SELECT
      id,
      code,
      type,
      discount_value AS discountValue,
      minimum_order_amount AS minimumOrderAmount,
      usage_limit AS usageLimit,
      used_count AS usedCount,
      DATE_FORMAT(starts_at, '%Y-%m-%d') AS startsAt,
      DATE_FORMAT(ends_at, '%Y-%m-%d') AS endsAt,
      is_active = 1 AS isActive
    FROM coupons
    ORDER BY created_at DESC
  `);
}

export async function createCoupon(runQuery, payload) {
  const coupon = normalizeCouponPayload(payload);

  if (!process.env.MYSQL_HOST) {
    const created = {
      id: Date.now(),
      ...coupon,
      usedCount: 0,
      isActive: true
    };
    mockCoupons.unshift(created);
    return created;
  }

  await ensureCouponsTable(runQuery);

  const result = await runQuery(
    `
      INSERT INTO coupons (
        code,
        type,
        discount_value,
        minimum_order_amount,
        usage_limit,
        starts_at,
        ends_at,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `,
    [
      coupon.code,
      coupon.type,
      coupon.discountValue,
      coupon.minimumOrderAmount,
      coupon.usageLimit,
      coupon.startsAt || null,
      coupon.endsAt || null
    ]
  );

  return { id: result.insertId, ...coupon, usedCount: 0, isActive: true };
}

export async function updateCouponStatus(runQuery, id, isActive) {
  const active = Boolean(isActive);

  if (!process.env.MYSQL_HOST) {
    const coupon = mockCoupons.find((item) => String(item.id) === String(id));

    if (coupon) {
      coupon.isActive = active;
    }

    return coupon || null;
  }

  await ensureCouponsTable(runQuery);
  await runQuery(`UPDATE coupons SET is_active = ? WHERE id = ?`, [active ? 1 : 0, Number(id)]);
  return { id: Number(id), isActive: active };
}

export async function deleteCoupon(runQuery, id) {
  if (!process.env.MYSQL_HOST) {
    const index = mockCoupons.findIndex((item) => String(item.id) === String(id));

    if (index >= 0) {
      mockCoupons.splice(index, 1);
    }

    return { deleted: true };
  }

  await ensureCouponsTable(runQuery);
  await runQuery(`DELETE FROM coupons WHERE id = ?`, [Number(id)]);
  return { deleted: true };
}

function normalizeCouponPayload(payload = {}) {
  const code = String(payload.code || '').trim().toUpperCase();
  const type = payload.type === 'fixed' ? 'fixed' : 'percentage';
  const discountValue = Number(payload.discountValue);
  const minimumOrderAmount = Number(payload.minimumOrderAmount || 0);
  const usageLimit = payload.usageLimit ? Number(payload.usageLimit) : null;

  if (!code) {
    throw new Error('Coupon code is required.');
  }

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new Error('Discount value must be greater than 0.');
  }

  if (type === 'percentage' && discountValue > 100) {
    throw new Error('Percentage discount cannot be greater than 100.');
  }

  if (!Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0) {
    throw new Error('Minimum order amount must be valid.');
  }

  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) {
    throw new Error('Usage limit must be a positive whole number.');
  }

  return {
    code,
    type,
    discountValue,
    minimumOrderAmount,
    usageLimit,
    startsAt: payload.startsAt || null,
    endsAt: payload.endsAt || null
  };
}
