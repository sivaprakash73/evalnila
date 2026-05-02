import { query } from '@/lib/db';
import { createSize, getSizes } from '@/lib/server/sizes-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'GET') {
    try {
      const sizes = await getSizes(query);
      return res.status(200).json(sizes);
    } catch (error) {
      return res.status(500).json({ message: 'Unable to load sizes.', error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const size = await createSize(query, req.body || {});
      return res.status(201).json({ message: 'Size created.', size });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to create size.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: 'Method not allowed' });
}
