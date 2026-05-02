import { categoryRows } from '@/lib/dashboard-data';

export function slugifyCategoryName(name = '') {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getCategories(runQuery) {
  if (!process.env.MYSQL_HOST) {
    return categoryRows.map((category) => ({
      ...category,
      slug: category.slug || slugifyCategoryName(category.name),
      productCount: 0
    }));
  }

  return runQuery(`
    SELECT
      c.id,
      c.name,
      c.slug,
      COUNT(p.id) AS productCount
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name, c.slug
    ORDER BY c.name ASC
  `);
}

export async function getCategoryBySlug(runQuery, slug) {
  const categories = await getCategories(runQuery);
  return categories.find((category) => category.slug === slug) || null;
}

export async function createCategory(runQuery, payload = {}) {
  const name = String(payload.name || '').trim();
  const slug = slugifyCategoryName(payload.slug || name);

  if (!name) {
    throw new Error('Category name is required.');
  }

  if (!slug) {
    throw new Error('Category slug is required.');
  }

  const existing = await runQuery(
    'SELECT id FROM categories WHERE name = ? OR slug = ? LIMIT 1',
    [name, slug]
  );

  if (existing.length) {
    throw new Error('Category name or slug already exists.');
  }

  const result = await runQuery(
    'INSERT INTO categories (name, slug) VALUES (?, ?)',
    [name, slug]
  );

  return {
    id: result.insertId,
    name,
    slug,
    productCount: 0
  };
}

export async function deleteCategory(runQuery, id) {
  const categoryId = Number(id);

  if (!categoryId) {
    throw new Error('Category id is required.');
  }

  const products = await runQuery(
    'SELECT COUNT(*) AS count FROM products WHERE category_id = ?',
    [categoryId]
  );

  if (Number(products[0]?.count || 0) > 0) {
    throw new Error('Move or delete products in this category before removing it.');
  }

  const result = await runQuery('DELETE FROM categories WHERE id = ?', [categoryId]);

  if (!result.affectedRows) {
    throw new Error('Category not found.');
  }

  return true;
}
