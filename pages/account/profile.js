import StoreLayout from '@/components/StoreLayout';
import { useState } from 'react';
import { getCustomerById } from '@/lib/server/customer-auth-service';
import { query } from '@/lib/db';
import { withCustomerPageAuth } from '@/lib/server/with-customer-auth';

export default function AccountProfilePage({ account }) {
  const [form, setForm] = useState(account);
  const [message, setMessage] = useState('');

  async function saveProfile() {
    const response = await fetch('/api/store/customers/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      return;
    }

    setMessage('Profile updated.');
  }

  return (
    <StoreLayout
      title="Profile"
      description="Customer profile settings for Evalnila."
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="page-panel">
            <p className="eyebrow mb-2">Profile Settings</p>
            <h1 className="section-heading">Manage customer profile details.</h1>

            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input className="form-control" value={`${form.firstName} ${form.lastName}`} onChange={(event) => {
                  const [firstName = '', ...rest] = event.target.value.split(' ');
                  setForm((current) => ({ ...current, firstName, lastName: rest.join(' ') }));
                }} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input className="form-control" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone || ''} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Country</label>
                <input className="form-control" value={form.country || ''} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label">Address</label>
                <input className="form-control" value={form.address || ''} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button type="button" className="btn btn-dark rounded-pill px-4" onClick={saveProfile}>
                  Save Changes
                </button>
              </div>
              {message ? <div className="col-12"><div className="alert alert-success mb-0">{message}</div></div> : null}
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}

export const getServerSideProps = withCustomerPageAuth(async (_context, customer) => {
  const account = await getCustomerById(query, customer.sub);

  return {
    props: {
      account
    }
  };
});
