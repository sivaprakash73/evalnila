import { NextResponse } from 'next/server';

const adminRedirects = [
  ['/login', '/admin/login'],
  ['/dashboard', '/admin/dashboard'],
  ['/analytics', '/admin/analytics'],
  ['/orders', '/admin/orders'],
  ['/products', '/admin/products'],
  ['/customers', '/admin/customers'],
  ['/settings', '/admin/settings']
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const match = adminRedirects.find(([source]) => pathname === source || pathname.startsWith(`${source}/`));

  if (!match) {
    return NextResponse.next();
  }

  const [source, destination] = match;
  const url = request.nextUrl.clone();
  url.pathname = `${destination}${pathname.slice(source.length)}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/login',
    '/dashboard',
    '/analytics',
    '/orders/:path*',
    '/products/:path*',
    '/customers',
    '/settings'
  ]
};
