import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import StoreLayout from '@/components/StoreLayout';
import { redirectIfCustomerAuthenticated } from '@/lib/server/with-customer-auth';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const endpoint = mode === 'login' ? '/api/store/customers/login' : '/api/store/customers/register';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form)
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.message || 'Unable to continue.');
      return;
    }

    router.push('/account');
  }

  return (
    <StoreLayout title="Customer Login" description="Login or register for an Evalnila customer account.">
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="auth-panel">
            <p className="eyebrow mb-2">Customer Account</p>
            <h1 className="section-heading">{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h1>

            <div className="d-flex gap-2 flex-wrap mt-3 mb-4">
              <button type="button" className={`payment-option ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
                Login
              </button>
              <button type="button" className={`payment-option ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="row g-3">
              {mode === 'register' ? (
                <>
                  <div className="col-md-6">
                    <label className="form-label">First Name</label>
                    <input className="form-control" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last Name</label>
                    <input className="form-control" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
                  </div>
                </>
              ) : null}

              <div className="col-12">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </div>

              <div className="col-12">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
              </div>

              {error ? <div className="col-12"><div className="alert alert-danger mb-0">{error}</div></div> : null}

              <div className="col-12 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <Link href="/store" className="btn btn-outline-dark rounded-pill px-4">
                  Back to Store
                </Link>
                <button type="submit" className="btn btn-dark rounded-pill px-4">
                  {mode === 'login' ? 'Login' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}

export const getServerSideProps = redirectIfCustomerAuthenticated('/account');
