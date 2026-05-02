import { query } from '@/lib/db';
import { deleteSize, updateSize } from '@/lib/server/sizes-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'PATCH') {
    try {
      const size = await updateSize(query, req.query.id, req.body || {});
      return res.status(200).json({ message: 'Size updated.', size });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to update size.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await deleteSize(query, req.query.id);
      return res.status(200).json({ message: 'Size deleted.' });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to delete size.' });
    }
  }

  res.setHeader('Allow', ['PATCH', 'DELETE']);
  return res.status(405).json({ message: 'Method not allowed' });
}
