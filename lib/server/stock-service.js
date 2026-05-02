import { getProducts } from '@/lib/server/products-service';

export async function getStockRows(runQuery) {
  const products = await getProducts(runQuery);

  return products.map((product) => {
    const stock = Number(product.stock) || 0;
    const reorderLevel = stock === 0 ? 25 : stock < 50 ? 50 : 75;

    return {
      ...product,
      stock,
      reorderLevel,
      stockValue: stock * Number(product.price || 0),
      stockStatus: getStockStatus(stock, reorderLevel)
    };
  });
}

export async function updateProductStock(runQuery, id, payload) {
  const stock = Number(payload?.stock);

  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error('Stock must be a whole number greater than or equal to 0.');
  }

  if (!process.env.MYSQL_HOST) {
    return { id: Number(id), stock };
  }

  await runQuery(
    `
      UPDATE products
      SET stock = ?
      WHERE id = ?
    `,
    [stock, Number(id)]
  );

  return { id: Number(id), stock };
}

function getStockStatus(stock, reorderLevel) {
  if (stock === 0) {
    return 'Out of Stock';
  }

  if (stock <= reorderLevel) {
    return 'Reorder';
  }

  return 'Ready';
}
