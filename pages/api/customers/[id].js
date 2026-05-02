import { query } from '@/lib/db';
import { getCustomerById } from '@/lib/server/customers-service';
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
    const customer = await getCustomerById(query, req.query.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    return res.status(200).json(customer);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load customer.', error: error.message });
  }
}
