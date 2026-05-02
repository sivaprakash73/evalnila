import { serialize } from 'cookie';
import { query } from '@/lib/db';
import { signCustomerToken, customerTokenName } from '@/lib/customer-auth';
import { registerCustomer } from '@/lib/server/customer-auth-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const customer = await registerCustomer(query, req.body || {});
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

    return res.status(201).json({ message: 'Customer registered.', customer });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Unable to register customer.' });
  }
}
