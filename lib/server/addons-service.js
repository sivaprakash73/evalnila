let addonsTablesReady = false;

export async function ensureAddonsTables(runQuery) {
  if (addonsTablesReady || !process.env.MYSQL_HOST) {
    return;
  }

  await runQuery(`
    CREATE TABLE IF NOT EXISTS addons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS product_addons (
      product_id INT NOT NULL,
      addon_id INT NOT NULL,
      PRIMARY KEY (product_id, addon_id),
      CONSTRAINT fk_product_addons_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_product_addons_addon
        FOREIGN KEY (addon_id) REFERENCES addons(id) ON DELETE CASCADE
    )
  `);

  addonsTablesReady = true;
}

export async function getAddons(runQuery) {
  if (!process.env.MYSQL_HOST) {
    return [];
  }

  await ensureAddonsTables(runQuery);

  return runQuery(`
    SELECT id, name, price, is_active AS isActive
    FROM addons
    ORDER BY name ASC
  `);
}

export async function createAddon(runQuery, payload = {}) {
  const name = String(payload.name || '').trim();
  const price = Number(payload.price);

  if (!name) {
    throw new Error('Add-on name is required.');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Add-on price must be zero or more.');
  }

  if (!process.env.MYSQL_HOST) {
    return { id: Date.now(), name, price, isActive: true };
  }

  await ensureAddonsTables(runQuery);
  const result = await runQuery(
    `
      INSERT INTO addons (name, price)
      VALUES (?, ?)
    `,
    [name, price]
  );

  return { id: result.insertId, name, price, isActive: true };
}

export async function deleteAddon(runQuery, id) {
  if (!process.env.MYSQL_HOST) {
    return { deleted: true };
  }

  await ensureAddonsTables(runQuery);
  await runQuery(`DELETE FROM addons WHERE id = ?`, [Number(id)]);
  return { deleted: true };
}
