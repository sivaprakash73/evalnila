import { DEFAULT_PRODUCT_SIZES, normalizeSizeLabel } from '@/lib/product-sizes';

let sizesTableReady = false;

async function ensureSizesTable(runQuery) {
  if (sizesTableReady || !process.env.MYSQL_HOST) {
    return;
  }

  await runQuery(`
    CREATE TABLE IF NOT EXISTS sizes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      label VARCHAR(40) NOT NULL UNIQUE,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (let index = 0; index < DEFAULT_PRODUCT_SIZES.length; index += 1) {
    await runQuery(
      `
        INSERT IGNORE INTO sizes (label, sort_order)
        VALUES (?, ?)
      `,
      [DEFAULT_PRODUCT_SIZES[index], index + 1]
    );
  }

  sizesTableReady = true;
}

export async function getSizes(runQuery) {
  if (!process.env.MYSQL_HOST) {
    return DEFAULT_PRODUCT_SIZES.map((label, index) => ({
      id: index + 1,
      label,
      sortOrder: index + 1
    }));
  }

  await ensureSizesTable(runQuery);

  return runQuery(`
    SELECT id, label, sort_order AS sortOrder
    FROM sizes
    ORDER BY sort_order ASC, label ASC
  `);
}

export async function createSize(runQuery, payload) {
  const label = normalizeSizeLabel(payload?.label);

  if (!label) {
    throw new Error('Size label is required.');
  }

  if (!process.env.MYSQL_HOST) {
    return { id: Date.now(), label, sortOrder: DEFAULT_PRODUCT_SIZES.length + 1 };
  }

  await ensureSizesTable(runQuery);
  const rows = await runQuery(`SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextSortOrder FROM sizes`);
  const sortOrder = Number(rows[0]?.nextSortOrder) || 1;

  await runQuery(
    `
      INSERT INTO sizes (label, sort_order)
      VALUES (?, ?)
    `,
    [label, sortOrder]
  );

  const sizes = await getSizes(runQuery);
  return sizes.find((size) => size.label === label) || { label, sortOrder };
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
