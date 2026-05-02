import { serialize } from 'cookie';
import { signAuthToken } from '@/lib/auth';
import { authenticateUser } from '@/lib/server/auth-service';
import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await authenticateUser(query, email, password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = signAuthToken(user);

  res.setHeader(
    'Set-Cookie',
    serialize('evalnila_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12
    })
  );

  return res.status(200).json({ message: 'Login successful.', user });
}
