import { query, getPool } from '@/lib/db';
import { createStoreOrder } from '@/lib/server/orders-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const order = await createStoreOrder(
      query,
      req.body || {},
      process.env.MYSQL_HOST ? getPool() : null
    );
    return res.status(201).json({ message: 'Order created.', order });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Unable to create order.' });
  }
}
