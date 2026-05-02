import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/router';

const commandPages = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'DB' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'AN' },
  { href: '/admin/orders', label: 'Orders', icon: 'OR', badge: '12' },
  { href: '/admin/products', label: 'Products', icon: 'PR' },
  { href: '/admin/customers', label: 'Customers', icon: 'CU' },
  { href: '/admin/coupons', label: 'Coupons', icon: 'CO' },
  { href: '/admin/stock', label: 'Stock', icon: 'ST' },
  { href: '/admin/shipping', label: 'Shipping', icon: 'SH' },
  { href: '/admin/settings', label: 'Settings', icon: 'SE' }
];

const breadcrumbLabels = {
  admin: 'Admin',
  analytics: 'Analytics',
  orders: 'Orders',
  'bill-print': 'Bill Print',
  stock: 'Stock',
  coupons: 'Coupons',
  'sales-report': 'Sales Report',
  products: 'Products',
  new: 'Add Product',
  categories: 'Categories',
  shipping: 'Shipping',
  'home-slider': 'Home Slider',
  sizes: 'Sizes',
  customers: 'Customers',
  settings: 'Settings'
};

export default function Layout({ title, subtitle, children, user }) {
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathParts = router.asPath.split('?')[0].split('/').filter(Boolean);
  const breadcrumbItems =
    pathParts.length > 0
      ? pathParts.map((part, index) => ({
          href: `/${pathParts.slice(0, index + 1).join('/')}`,
          label: breadcrumbLabels[part] || title || part
        }))
      : [];
  const filteredCommands = useMemo(() => {
    const normalizedSearch = commandSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return commandPages;
    }

    return commandPages.filter((page) => page.label.toLowerCase().includes(normalizedSearch));
  }, [commandSearch]);
  const userInitials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AD';

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  function handleCommandSelect(href) {
    setCommandOpen(false);
    setCommandSearch('');
    router.push(href);
  }

  return (
    <>
      <Head>
        <title>{title} | Evalnila</title>
        <meta
          name="description"
          content="Evalnila e-commerce admin dashboard built with Next.js, Bootstrap, Node.js, and MySQL."
        />
      </Head>

      <div className="dashboard-shell">
        <Sidebar />

        <main className="dashboard-main">
          <header className="admin-topbar">
            <button type="button" className="admin-search-trigger" onClick={() => setCommandOpen(true)}>
              <span className="admin-search-mark" aria-hidden="true" />
              <span>Search anything...</span>
            </button>

            <div className="admin-topbar-actions">
              <div className="admin-user-menu-wrap">
                <button
                  type="button"
                  className="admin-avatar-btn"
                  aria-label="Open user menu"
                  aria-expanded={userMenuOpen}
                  onClick={() => setUserMenuOpen((open) => !open)}
                >
                  {userInitials}
                </button>
                {userMenuOpen ? (
                  <div className="admin-user-menu">
                    {user ? (
                      <div className="admin-user-menu-meta">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    ) : null}
                    <button type="button" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <section className="admin-page-header">
            <h1 className="page-title mb-1">{title}</h1>
            {breadcrumbItems.length ? (
              <nav className="admin-breadcrumb" aria-label="Breadcrumb">
                <ol className="breadcrumb mb-2">
                  {breadcrumbItems.map((item, index) => {
                    const active = index === breadcrumbItems.length - 1;

                    return (
                      <li
                        key={item.href}
                        className={`breadcrumb-item ${active ? 'active' : ''}`}
                        aria-current={active ? 'page' : undefined}
                      >
                        {active ? item.label : <Link href={item.href}>{item.label}</Link>}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            ) : null}
            <p className="page-subtitle mb-0">{subtitle}</p>
          </section>

          <div className="content-space">{children}</div>
        </main>
      </div>

      {commandOpen ? (
        <div className="admin-command-backdrop" onMouseDown={() => setCommandOpen(false)}>
          <div
            className="admin-command-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Search admin pages"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-command-search">
              <span className="admin-search-mark" aria-hidden="true" />
              <input
                type="search"
                autoFocus
                value={commandSearch}
                onChange={(event) => setCommandSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setCommandOpen(false);
                  }
                }}
                placeholder="Type a command or search..."
              />
              <button type="button" aria-label="Close search" onClick={() => setCommandOpen(false)}>
                x
              </button>
            </div>

            <div className="admin-command-list">
              <p className="admin-command-label mb-2">Pages</p>
              {filteredCommands.length ? (
                filteredCommands.map((page) => {
                  const active =
                    router.pathname === page.href ||
                    (page.href !== '/admin/dashboard' && router.pathname.startsWith(`${page.href}/`));

                  return (
                    <button
                      type="button"
                      key={page.href}
                      className={`admin-command-item ${active ? 'active' : ''}`}
                      onClick={() => handleCommandSelect(page.href)}
                    >
                      <span className="admin-command-icon">{page.icon}</span>
                      <span>{page.label}</span>
                      {page.badge ? <span className="admin-command-badge">{page.badge}</span> : null}
                    </button>
                  );
                })
              ) : (
                <div className="admin-command-empty">No matching pages.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
