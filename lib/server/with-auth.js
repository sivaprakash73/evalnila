import { getTokenFromRequest, verifyAuthToken } from '@/lib/auth';

export function withPageAuth(handler, options = {}) {
  return async function wrapped(context) {
    const user = getAuthenticatedUser(context.req);

    if (!isAdminUser(user)) {
      return {
        redirect: {
          destination: options.loginPath || '/admin/login',
          permanent: false
        }
      };
    }

    const result = await handler(context, user);
    return {
      ...result,
      props: {
        ...(result.props || {}),
        user
      }
    };
  };
}

export function redirectIfAuthenticated(destination) {
  return async function wrapped(context) {
    const user = getAuthenticatedUser(context.req);

    if (isAdminUser(user)) {
      return {
        redirect: {
          destination,
          permanent: false
        }
      };
    }

    return {
      props: {}
    };
  };
}

export async function requireApiAuth(req, res) {
  const user = getAuthenticatedUser(req);

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }

  if (!isAdminUser(user)) {
    res.status(403).json({ message: 'Admin access required' });
    return null;
  }

  return user;
}

function isAdminUser(user) {
  return Boolean(user && (user.type === 'admin' || user.role === 'admin'));
}

function getAuthenticatedUser(req) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return null;
    }

    return verifyAuthToken(token);
  } catch {
    return null;
  }
}
