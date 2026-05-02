import { query } from '@/lib/db';
import { deleteAddon } from '@/lib/server/addons-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await deleteAddon(query, req.query.id);
      return res.status(200).json({ message: 'Add-on deleted.' });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to delete add-on.' });
    }
  }

  res.setHeader('Allow', ['DELETE']);
  return res.status(405).json({ message: 'Method not allowed' });
}
