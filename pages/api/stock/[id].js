import { query } from '@/lib/db';
import { updateProductStock } from '@/lib/server/stock-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'PATCH') {
    try {
      const stock = await updateProductStock(query, req.query.id, req.body || {});
      return res.status(200).json({ message: 'Stock updated.', stock });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to update stock.' });
    }
  }

  res.setHeader('Allow', ['PATCH']);
  return res.status(405).json({ message: 'Method not allowed' });
}
