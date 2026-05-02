import { query } from '@/lib/db';
import { getOrderByNumber } from '@/lib/server/orders-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const orderNumber = String(req.query.orderNumber || '').trim();

  if (!orderNumber) {
    return res.status(400).json({ message: 'Order number is required.' });
  }

  try {
    const order = await getOrderByNumber(query, orderNumber);

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to track order.', error: error.message });
  }
}
