import { query } from '@/lib/db';
import { deleteSize } from '@/lib/server/sizes-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await deleteSize(query, req.query.id);
      return res.status(200).json({ message: 'Size deleted.' });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to delete size.' });
    }
  }

  res.setHeader('Allow', ['DELETE']);
  return res.status(405).json({ message: 'Method not allowed' });
}
