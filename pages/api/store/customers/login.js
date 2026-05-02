import { serialize } from 'cookie';
import { query } from '@/lib/db';
import { authenticateCustomer } from '@/lib/server/customer-auth-service';
import { customerTokenName, signCustomerToken } from '@/lib/customer-auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  try {
    const customer = await authenticateCustomer(query, email, password);

    if (!customer) {
      return res.status(401).json({ message: 'Invalid customer credentials.' });
    }

    const token = signCustomerToken(customer);

    res.setHeader(
      'Set-Cookie',
      serialize(customerTokenName, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 14
      })
    );

    return res.status(200).json({ message: 'Customer logged in.', customer });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Unable to login customer.' });
  }
}
