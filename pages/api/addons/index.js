import { query } from '@/lib/db';
import { createAddon, getAddons } from '@/lib/server/addons-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'GET') {
    try {
      return res.status(200).json(await getAddons(query));
    } catch (error) {
      return res.status(500).json({ message: 'Unable to load add-ons.', error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const addon = await createAddon(query, req.body || {});
      return res.status(201).json({ message: 'Add-on created.', addon });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to create add-on.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: 'Method not allowed' });
}
