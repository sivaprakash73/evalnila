import { query } from '@/lib/db';
import { deleteCategory } from '@/lib/server/categories-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await deleteCategory(query, req.query.id);
      return res.status(200).json({ message: 'Category removed.' });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to remove category.' });
    }
  }

  res.setHeader('Allow', ['DELETE']);
  return res.status(405).json({ message: 'Method not allowed' });
}
