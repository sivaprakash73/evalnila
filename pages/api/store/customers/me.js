import { query } from '@/lib/db';
import { getCustomerById, updateCustomerProfile } from '@/lib/server/customer-auth-service';
import { requireCustomerApiAuth } from '@/lib/server/with-customer-auth';

export default async function handler(req, res) {
  const customer = await requireCustomerApiAuth(req, res);

  if (!customer) {
    return;
  }

  if (req.method === 'GET') {
    const record = await getCustomerById(query, customer.sub);
    return res.status(200).json(record);
  }

  if (req.method === 'PUT') {
    try {
      const updated = await updateCustomerProfile(query, customer.sub, req.body || {});
      return res.status(200).json({ message: 'Profile updated.', customer: updated });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to update profile.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ message: 'Method not allowed' });
}
