import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { redirectIfAuthenticated } from '@/lib/server/with-auth';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: 'admin@evalnila.com',
    password: 'admin123'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form)
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.message || 'Login failed.');
      setLoading(false);
      return;
    }

    router.push('/admin/dashboard');
  }

  return (
    <>
      <Head>
        <title>Login | Evalnila</title>
      </Head>

      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-brand">
            Evalnila
          </div>
          <p className="eyebrow mb-2">Evalnila Admin</p>
          <h1 className="auth-title">Admin Login</h1>
          <p className="auth-copy">
            Sign in to manage products, orders, customers, and storefront operations.
          </p>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control form-control-lg"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control form-control-lg"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
            </div>

            {error ? <div className="alert alert-danger">{error}</div> : null}

            <button type="submit" className="btn btn-dark btn-lg w-100 rounded-pill" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-note">
            Default starter access: <strong>admin@evalnila.com</strong> / <strong>admin123</strong>
          </div>
        </section>
      </main>
    </>
  );
}

export const getServerSideProps = redirectIfAuthenticated('/admin/dashboard');
