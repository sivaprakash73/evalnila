import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useRouter } from 'next/router';

const storeCommandPages = [
  { href: '/', label: 'Home', icon: 'HO' },
  { href: '/store', label: 'Shop', icon: 'SH' },
  { href: '/about', label: 'About', icon: 'AB' },
  { href: '/contact', label: 'Contact', icon: 'CO' },
  { href: '/faq', label: 'FAQ', icon: 'FA' },
  { href: '/wishlist', label: 'Wishlist', icon: 'WI' },
  { href: '/cart', label: 'Cart', icon: 'CA' },
  { href: '/order-tracking', label: 'Track Order', icon: 'TR' },
  { href: '/account', label: 'Account', icon: 'AC' }
];

export default function StoreLayout({ title, description, children }) {
  const { cartCount, wishlistItems } = useStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const filteredPages = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return storeCommandPages;
    }

    return storeCommandPages.filter((page) => page.label.toLowerCase().includes(normalizedSearch));
  }, [searchValue]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchValue('');
  }

  function selectSearchPage(href) {
    closeSearch();
    closeMobileMenu();
    router.push(href);
  }

  async function handleCustomerLogout() {
    await fetch('/api/store/customers/logout', { method: 'POST' });
    closeMobileMenu();
    router.push('/');
  }

  return (
    <>
      <Head>
        <title>{`${title} | Evalnila`}</title>
        <meta name="description" content={description} />
      </Head>

      <div className="store-shell">
        <header className="store-header">
          <div className="store-nav container-fluid">
            <Link href="/" className="store-brand" onClick={closeMobileMenu}>
              Evalnila
            </Link>

            <button type="button" className="store-search-trigger" onClick={() => setSearchOpen(true)}>
              <span className="admin-search-mark" aria-hidden="true" />
              <span>Search anything...</span>
              <kbd>Ctrl K</kbd>
            </button>

            <div className="store-mobile-actions">
              <button type="button" className="store-icon-link store-mobile-search" aria-label="Search" title="Search" onClick={() => setSearchOpen(true)}>
                <span className="admin-search-mark" aria-hidden="true" />
              </button>
              <Link href="/wishlist" className="store-icon-link" aria-label={`Wishlist with ${wishlistItems.length} items`} title="Wishlist" onClick={closeMobileMenu}>
                <svg className="store-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.8 4.6c-2-1.8-5.1-1.5-6.8.5l-2 2.2-2-2.2c-1.7-2-4.8-2.3-6.8-.5-2.2 2-2.3 5.4-.2 7.5l9 8.5 9-8.5c2.1-2.1 2-5.5-.2-7.5Z" />
                </svg>
                {wishlistItems.length ? <span className="store-nav-count">{wishlistItems.length}</span> : null}
              </Link>
              <Link href="/cart" className="store-icon-link" aria-label={`Cart with ${cartCount} items`} title="Cart" onClick={closeMobileMenu}>
                <svg className="store-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.2 8h15.1l-1.8 8.6c-.2.8-.9 1.4-1.8 1.4H8.5c-.9 0-1.6-.6-1.8-1.4L4.7 4H2.5" />
                  <path d="M9 21h.1M17 21h.1" />
                  <path d="M9 8a3 3 0 0 1 6 0" />
                </svg>
                {cartCount ? <span className="store-nav-count">{cartCount}</span> : null}
              </Link>

              <button
                type="button"
                className={`store-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="store-mobile-menu"
                onClick={() => setMobileMenuOpen((current) => !current)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>

            <nav id="store-mobile-menu" className={`store-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <Link href="/" onClick={closeMobileMenu}>Home</Link>
              <Link href="/store" onClick={closeMobileMenu}>Shop</Link>
              <Link href="/about" onClick={closeMobileMenu}>About</Link>
              <Link href="/contact" onClick={closeMobileMenu}>Contact</Link>
              <Link href="/faq" onClick={closeMobileMenu}>FAQ</Link>
              <Link href="/wishlist" className="store-icon-link" aria-label={`Wishlist with ${wishlistItems.length} items`} title="Wishlist" onClick={closeMobileMenu}>
                <svg className="store-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.8 4.6c-2-1.8-5.1-1.5-6.8.5l-2 2.2-2-2.2c-1.7-2-4.8-2.3-6.8-.5-2.2 2-2.3 5.4-.2 7.5l9 8.5 9-8.5c2.1-2.1 2-5.5-.2-7.5Z" />
                </svg>
                {wishlistItems.length ? <span className="store-nav-count">{wishlistItems.length}</span> : null}
              </Link>
              <Link href="/cart" className="store-icon-link" aria-label={`Cart with ${cartCount} items`} title="Cart" onClick={closeMobileMenu}>
                <svg className="store-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.2 8h15.1l-1.8 8.6c-.2.8-.9 1.4-1.8 1.4H8.5c-.9 0-1.6-.6-1.8-1.4L4.7 4H2.5" />
                  <path d="M9 21h.1M17 21h.1" />
                  <path d="M9 8a3 3 0 0 1 6 0" />
                </svg>
                {cartCount ? <span className="store-nav-count">{cartCount}</span> : null}
              </Link>
              <Link href="/order-tracking" onClick={closeMobileMenu}>Track Order</Link>
              <Link href="/account" onClick={closeMobileMenu}>Account</Link>
              {router.pathname.startsWith('/account') ? (
                <button type="button" className="store-link-button" onClick={handleCustomerLogout}>
                  Logout
                </button>
              ) : null}
            </nav>
          </div>
          {mobileMenuOpen ? <button type="button" className="store-menu-backdrop" aria-label="Close menu" onClick={closeMobileMenu} /> : null}
        </header>

        <main>{children}</main>

        <footer className="store-footer">
          <div className="container-fluid store-footer-grid">
            <div>
              <div className="footer-brand-row">
                <div className="store-brand mb-0">
                  Evalnila
                </div>
                <a href="https://instagram.com/evalnila" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <svg className="footer-social-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="5" />
                    <circle cx="12" cy="12" r="3.5" />
                    <circle cx="17" cy="7" r="1" />
                  </svg>
                </a>
              </div>
              <p className="store-copy mb-0">
                Womens clothing brand for customized stitching, ethnic wear, western wear, and saree looks.
              </p>
              <div className="footer-contact-links">
                <a href="tel:+916374769119">
                  +91 63747 69119
                </a>
                <a href="tel:+919944873489">
                  +91 99448 73489
                </a>
              </div>
            </div>

            <div className="footer-links">
              <Link href="/store">Shop</Link>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/faq">FAQ</Link>
              <Link href="/cart">Cart</Link>
              <Link href="/wishlist">Wishlist</Link>
              <Link href="/account">Account</Link>
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
        </footer>
      </div>

      {searchOpen ? (
        <div className="admin-command-backdrop store-command-backdrop" onMouseDown={closeSearch}>
          <div
            className="admin-command-menu store-command-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Search storefront pages"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-command-search">
              <span className="admin-search-mark" aria-hidden="true" />
              <input
                type="search"
                autoFocus
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    closeSearch();
                  }
                }}
                placeholder="Type a page or search..."
              />
              <button type="button" aria-label="Close search" onClick={closeSearch}>
                x
              </button>
            </div>

            <div className="admin-command-list">
              <p className="admin-command-label mb-2">Pages</p>
              {filteredPages.length ? (
                filteredPages.map((page) => {
                  const active =
                    router.pathname === page.href ||
                    (page.href !== '/' && router.pathname.startsWith(`${page.href}/`));

                  return (
                    <button
                      type="button"
                      key={page.href}
                      className={`admin-command-item ${active ? 'active' : ''}`}
                      onClick={() => selectSearchPage(page.href)}
                    >
                      <span className="admin-command-icon">{page.icon}</span>
                      <span>{page.label}</span>
                      {page.href === '/cart' && cartCount ? <span className="admin-command-badge">{cartCount}</span> : null}
                      {page.href === '/wishlist' && wishlistItems.length ? (
                        <span className="admin-command-badge">{wishlistItems.length}</span>
                      ) : null}
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
