import { query } from '@/lib/db';
import { getShippingSettings, updateShippingSettings } from '@/lib/server/shipping-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'GET') {
    try {
      const settings = await getShippingSettings(query);
      return res.status(200).json({ settings });
    } catch (error) {
      return res.status(500).json({ message: 'Unable to load shipping settings.', error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const settings = await updateShippingSettings(query, req.body || {});
      return res.status(200).json({ message: 'Shipping settings saved.', settings });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to save shipping settings.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ message: 'Method not allowed' });
}
