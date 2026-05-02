import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/bill-print', label: 'Bill Print' },
  { href: '/admin/stock', label: 'Stock' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/sales-report', label: 'Sales Report' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/products/new', label: 'Add Product' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/shipping', label: 'Shipping' },
  { href: '/admin/home-slider', label: 'Home Slider' },
  { href: '/admin/sizes', label: 'Sizes' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/settings', label: 'Settings' }
];

export default function Sidebar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header className="admin-mobile-header">
        <div className="brand-mark mb-0">Evalnila</div>
        <button
          type="button"
          className="admin-menu-toggle"
          aria-label={menuOpen ? 'Close admin menu' : 'Open admin menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <button
        type="button"
        className={`admin-sidebar-backdrop ${menuOpen ? 'show' : ''}`}
        aria-label="Close admin menu"
        onClick={closeMenu}
      />

      <aside className={`sidebar ${menuOpen ? 'mobile-open' : ''}`}>
        <div>
          <div className="brand-mark">
            Evalnila
          </div>
          <p className="sidebar-text">Admin control center for products, orders, and storefront growth.</p>
        </div>

        <nav className="admin-nav nav flex-column gap-2 mt-4">
          {navItems.map((item) => {
            const active =
              router.pathname === item.href ||
              (item.href !== '/admin/dashboard' && router.pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link sidebar-link ${active ? 'active' : ''}`}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer mt-auto">
          <p className="mb-1 fw-semibold">Schema Ready</p>
          <p className="mb-0 small text-white-50">
            Connect `.env.local`, seed the admin user, and manage Evalnila from one place.
          </p>
        </div>
      </aside>
    </>
  );
}
