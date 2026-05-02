import { query } from '@/lib/db';
import { getOrderById, updateOrderStatus } from '@/lib/server/orders-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'GET') {
    try {
      const order = await getOrderById(query, req.query.id);

      if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
      }

      return res.status(200).json(order);
    } catch (error) {
      return res.status(500).json({ message: 'Unable to load order.', error: error.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const order = await updateOrderStatus(query, req.query.id, req.body || {});
      return res.status(200).json({ message: 'Order updated.', order });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to update order.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ message: 'Method not allowed' });
}
