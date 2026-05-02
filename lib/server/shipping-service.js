const DEFAULT_SHIPPING_SETTINGS = {
  shippingAmount: 20,
  freeShippingMinimum: 1000
};

let commerceSettingsTableReady = false;

export async function getShippingSettings(runQuery) {
  if (!process.env.MYSQL_HOST) {
    return DEFAULT_SHIPPING_SETTINGS;
  }

  await ensureCommerceSettingsTable(runQuery);

  const rows = await runQuery(`
    SELECT setting_key AS settingKey, setting_value AS settingValue
    FROM commerce_settings
    WHERE setting_key IN ('shipping_amount', 'free_shipping_minimum')
  `);
  const values = new Map(rows.map((row) => [row.settingKey, Number(row.settingValue)]));

  return {
    shippingAmount: getFiniteSetting(values.get('shipping_amount'), DEFAULT_SHIPPING_SETTINGS.shippingAmount),
    freeShippingMinimum: getFiniteSetting(values.get('free_shipping_minimum'), DEFAULT_SHIPPING_SETTINGS.freeShippingMinimum)
  };
}

export async function updateShippingSettings(runQuery, payload = {}) {
  const shippingAmount = Number(payload.shippingAmount);
  const freeShippingMinimum = Number(payload.freeShippingMinimum);

  if (!Number.isFinite(shippingAmount) || shippingAmount < 0) {
    throw new Error('Shipping amount must be zero or more.');
  }

  if (!Number.isFinite(freeShippingMinimum) || freeShippingMinimum < 0) {
    throw new Error('Free delivery minimum must be zero or more.');
  }

  if (!process.env.MYSQL_HOST) {
    return {
      shippingAmount,
      freeShippingMinimum
    };
  }

  await ensureCommerceSettingsTable(runQuery);
  await saveSetting(runQuery, 'shipping_amount', shippingAmount);
  await saveSetting(runQuery, 'free_shipping_minimum', freeShippingMinimum);

  return getShippingSettings(runQuery);
}

async function ensureCommerceSettingsTable(runQuery) {
  if (commerceSettingsTableReady || !process.env.MYSQL_HOST) {
    return;
  }

  await runQuery(`
    CREATE TABLE IF NOT EXISTS commerce_settings (
      setting_key VARCHAR(80) PRIMARY KEY,
      setting_value DECIMAL(10, 2) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await insertDefaultSetting(runQuery, 'shipping_amount', DEFAULT_SHIPPING_SETTINGS.shippingAmount);
  await insertDefaultSetting(runQuery, 'free_shipping_minimum', DEFAULT_SHIPPING_SETTINGS.freeShippingMinimum);

  commerceSettingsTableReady = true;
}

async function saveSetting(runQuery, key, value) {
  await runQuery(
    `
      INSERT INTO commerce_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `,
    [key, value]
  );
}

async function insertDefaultSetting(runQuery, key, value) {
  await runQuery(
    `
      INSERT IGNORE INTO commerce_settings (setting_key, setting_value)
      VALUES (?, ?)
    `,
    [key, value]
  );
}

function getFiniteSetting(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}
