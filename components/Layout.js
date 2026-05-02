import Head from 'next/head';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/router';

export default function Layout({ title, subtitle, children, user }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
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
          <div className="hero-panel">
            <p className="eyebrow mb-2">Ecom Setup</p>
            <div className="admin-hero-content d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-end">
              <div>
                <h1 className="page-title mb-2">{title}</h1>
                <p className="page-subtitle mb-0">{subtitle}</p>
              </div>

              <div className="admin-hero-actions d-flex flex-column align-items-lg-end gap-3">
                {user ? (
                  <div className="admin-user-bar d-flex align-items-center gap-3">
                    <div className="admin-user-meta text-end">
                      <div className="fw-semibold">{user.name}</div>
                      <div className="small text-muted">{user.email}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-dark btn-sm rounded-pill px-3"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="content-space">{children}</div>
        </main>
      </div>
    </>
  );
}
