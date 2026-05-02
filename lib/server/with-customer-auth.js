import { getCustomerTokenFromRequest, verifyCustomerToken } from '@/lib/customer-auth';

export function withCustomerPageAuth(handler) {
  return async function wrapped(context) {
    const customer = getAuthenticatedCustomer(context.req);

    if (!customer) {
      return {
        redirect: {
          destination: '/account/login',
          permanent: false
        }
      };
    }

    const result = await handler(context, customer);
    return {
      ...result,
      props: {
        ...(result.props || {}),
        customer
      }
    };
  };
}

export function redirectIfCustomerAuthenticated(destination) {
  return async function wrapped(context) {
    const customer = getAuthenticatedCustomer(context.req);

    if (customer) {
      return {
        redirect: {
          destination,
          permanent: false
        }
      };
    }

    return { props: {} };
  };
}

export async function requireCustomerApiAuth(req, res) {
  const customer = getAuthenticatedCustomer(req);

  if (!customer) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }

  return customer;
}

function getAuthenticatedCustomer(req) {
  try {
    const token = getCustomerTokenFromRequest(req);

    if (!token) {
      return null;
    }

    return verifyCustomerToken(token);
  } catch {
    return null;
  }
}
