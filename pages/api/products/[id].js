import { query } from '@/lib/db';
import { deleteProduct, getProductById, updateProduct } from '@/lib/server/products-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const product = await getProductById(query, id);

      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      return res.status(200).json(product);
    } catch (error) {
      return res.status(500).json({ message: 'Unable to load product.', error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const product = await updateProduct(query, id, req.body || {});
      return res.status(200).json({ message: 'Product updated.', product });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to update product.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await deleteProduct(query, id);
      return res.status(200).json({ message: 'Product deleted.' });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to delete product.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ message: 'Method not allowed' });
}
