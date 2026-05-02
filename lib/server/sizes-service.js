import { DEFAULT_PRODUCT_SIZES, normalizeSizeLabel } from '@/lib/product-sizes';

let sizesTableReady = false;

const measurementColumns = [
  { name: 'bust', after: 'sort_order' },
  { name: 'waist', after: 'bust' },
  { name: 'hip', after: 'waist' }
];

const DEFAULT_SIZE_MEASUREMENTS = {
  XS: { bust: 32, waist: 26, hip: 36 },
  S: { bust: 34, waist: 28, hip: 38 },
  M: { bust: 36, waist: 30, hip: 40 },
  L: { bust: 38, waist: 32, hip: 42 },
  XL: { bust: 40, waist: 34, hip: 44 },
  XXL: { bust: 42, waist: 36, hip: 46 }
};

async function ensureSizesTable(runQuery) {
  if (sizesTableReady || !process.env.MYSQL_HOST) {
    return;
  }

  await runQuery(`
    CREATE TABLE IF NOT EXISTS sizes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      label VARCHAR(40) NOT NULL UNIQUE,
      sort_order INT NOT NULL DEFAULT 0,
      bust DECIMAL(5, 2),
      waist DECIMAL(5, 2),
      hip DECIMAL(5, 2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const column of measurementColumns) {
    const rows = await runQuery(
      `
        SELECT COUNT(*) AS count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'sizes'
          AND COLUMN_NAME = ?
      `,
      [column.name]
    );

    if (!Number(rows[0]?.count)) {
      await runQuery(`ALTER TABLE sizes ADD COLUMN ${column.name} DECIMAL(5, 2) NULL AFTER ${column.after}`);
    }
  }

  for (let index = 0; index < DEFAULT_PRODUCT_SIZES.length; index += 1) {
    const measurements = DEFAULT_SIZE_MEASUREMENTS[DEFAULT_PRODUCT_SIZES[index]] || {};
    await runQuery(
      `
        INSERT IGNORE INTO sizes (label, sort_order, bust, waist, hip)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        DEFAULT_PRODUCT_SIZES[index],
        index + 1,
        measurements.bust || null,
        measurements.waist || null,
        measurements.hip || null
      ]
    );
  }

  for (const [label, measurements] of Object.entries(DEFAULT_SIZE_MEASUREMENTS)) {
    await runQuery(
      `
        UPDATE sizes
        SET
          bust = COALESCE(bust, ?),
          waist = COALESCE(waist, ?),
          hip = COALESCE(hip, ?)
        WHERE label = ?
      `,
      [measurements.bust, measurements.waist, measurements.hip, label]
    );
  }

  sizesTableReady = true;
}

export async function getSizes(runQuery) {
  if (!process.env.MYSQL_HOST) {
    return DEFAULT_PRODUCT_SIZES.map((label, index) => ({
      id: index + 1,
      label,
      sortOrder: index + 1,
      bust: null,
      waist: null,
      hip: null
    }));
  }

  await ensureSizesTable(runQuery);

  return runQuery(`
    SELECT id, label, sort_order AS sortOrder, bust, waist, hip
    FROM sizes
    ORDER BY sort_order ASC, label ASC
  `);
}

export async function createSize(runQuery, payload) {
  const label = normalizeSizeLabel(payload?.label);
  const bust = normalizeMeasurement(payload?.bust);
  const waist = normalizeMeasurement(payload?.waist);
  const hip = normalizeMeasurement(payload?.hip);

  if (!label) {
    throw new Error('Size label is required.');
  }

  if ([bust, waist, hip].some((value) => value !== null && value < 0)) {
    throw new Error('Size measurements must be zero or more.');
  }

  if (!process.env.MYSQL_HOST) {
    return { id: Date.now(), label, sortOrder: DEFAULT_PRODUCT_SIZES.length + 1, bust, waist, hip };
  }

  await ensureSizesTable(runQuery);
  const rows = await runQuery(`SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextSortOrder FROM sizes`);
  const sortOrder = Number(rows[0]?.nextSortOrder) || 1;

  await runQuery(
    `
      INSERT INTO sizes (label, sort_order, bust, waist, hip)
      VALUES (?, ?, ?, ?, ?)
    `,
    [label, sortOrder, bust, waist, hip]
  );

  const sizes = await getSizes(runQuery);
  return sizes.find((size) => size.label === label) || { label, sortOrder };
}

export async function updateSize(runQuery, id, payload) {
  const bust = normalizeMeasurement(payload?.bust);
  const waist = normalizeMeasurement(payload?.waist);
  const hip = normalizeMeasurement(payload?.hip);

  if ([bust, waist, hip].some((value) => value !== null && value < 0)) {
    throw new Error('Size measurements must be zero or more.');
  }

  if (!process.env.MYSQL_HOST) {
    return {
      id: Number(id),
      label: payload?.label || '',
      bust,
      waist,
      hip
    };
  }

  await ensureSizesTable(runQuery);
  await runQuery(
    `
      UPDATE sizes
      SET bust = ?, waist = ?, hip = ?
      WHERE id = ?
    `,
    [bust, waist, hip, Number(id)]
  );

  const sizes = await getSizes(runQuery);
  return sizes.find((size) => Number(size.id) === Number(id)) || null;
}

export async function deleteSize(runQuery, id) {
  if (!process.env.MYSQL_HOST) {
    return { deleted: true };
  }

  await ensureSizesTable(runQuery);
  await runQuery(`DELETE FROM sizes WHERE id = ?`, [Number(id)]);
  return { deleted: true };
}

export { ensureSizesTable };

function normalizeMeasurement(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
