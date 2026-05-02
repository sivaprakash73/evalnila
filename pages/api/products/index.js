import { query } from '@/lib/db';
import { getProducts, createProduct } from '@/lib/server/products-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'GET') {
    try {
      const products = await getProducts(query);
      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ message: 'Unable to load products.', error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const product = await createProduct(query, req.body || {});
      return res.status(201).json({ message: 'Product created.', product });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to create product.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: 'Method not allowed' });
}
