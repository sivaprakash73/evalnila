import { query } from '@/lib/db';
import { getOrders } from '@/lib/server/orders-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const rows = await getOrders(query);

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({
      message: 'Unable to load orders.',
      error: error.message
    });
  }
}
