import { query } from '@/lib/db';
import { getCustomers } from '@/lib/server/customers-service';
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
    const customers = await getCustomers(query);
    return res.status(200).json(customers);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load customers.', error: error.message });
  }
}
