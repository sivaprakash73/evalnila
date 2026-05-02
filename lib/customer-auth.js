import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const CUSTOMER_TOKEN_NAME = 'evalnila_customer_token';

export function signCustomerToken(customer) {
  const secret = process.env.JWT_SECRET || 'dev-only-secret';

  return jwt.sign(
    {
      sub: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      type: 'customer'
    },
    secret,
    { expiresIn: '14d' }
  );
}

export function verifyCustomerToken(token) {
  const secret = process.env.JWT_SECRET || 'dev-only-secret';
  return jwt.verify(token, secret);
}

export function getCustomerTokenFromRequest(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies[CUSTOMER_TOKEN_NAME];
}

export const customerTokenName = CUSTOMER_TOKEN_NAME;
