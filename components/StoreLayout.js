import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useRouter } from 'next/router';

export default function StoreLayout({ title, description, children }) {
  const { cartCount, wishlistItems } = useStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
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

            <div className="store-mobile-actions">
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
    </>
  );
}
