import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const TOKEN_NAME = 'evalnila_token';

export function signAuthToken(user) {
  const secret = process.env.JWT_SECRET || 'dev-only-secret';

  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      type: 'admin'
    },
    secret,
    { expiresIn: '12h' }
  );
}

export function verifyAuthToken(token) {
  const secret = process.env.JWT_SECRET || 'dev-only-secret';
  return jwt.verify(token, secret);
}

export function getTokenFromRequest(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies[TOKEN_NAME];
}
