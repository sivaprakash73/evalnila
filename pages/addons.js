import { useState } from 'react';
import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import DataTable from '@/components/DataTable';
import { formatRupees } from '@/lib/currency';
import { query } from '@/lib/db';
import { getAddons } from '@/lib/server/addons-service';
import { withPageAuth } from '@/lib/server/with-auth';

export default function AddonsPage({ user, addons: initialAddons }) {
  const [addons, setAddons] = useState(initialAddons);
  const [form, setForm] = useState({ name: '', price: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    const response = await fetch('/api/addons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, price: Number(form.price) })
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.message || 'Unable to create add-on.');
      return;
    }

    setAddons((current) => [...current, payload.addon].sort((left, right) => left.name.localeCompare(right.name)));
    setForm({ name: '', price: '' });
    setMessage(`Add-on ${payload.addon.name} created.`);
  }

  async function handleDelete(addon) {
    const response = await fetch(`/api/addons/${addon.id}`, { method: 'DELETE' });

    if (!response.ok) {
      setError('Unable to delete add-on.');
      return;
    }

    setAddons((current) => current.filter((item) => item.id !== addon.id));
  }

  return (
    <Layout title="Add-ons" subtitle="Create paid product add-ons for storefront product pages." user={user}>
      <SectionCard title="Add-on Creation" description="Add optional product extras with their own price.">
        <form className="row g-3 align-items-end" onSubmit={handleSubmit}>
          <div className="col-md-6">
            <label className="form-label">Add-on Name</label>
            <input className="form-control" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Feeding zipper" required />
          </div>
          <div className="col-md-3">
            <label className="form-label">Price</label>
            <input className="form-control" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="199" required />
          </div>
          <div className="col-md-3">
            <button type="submit" className="btn btn-dark rounded-pill px-4 w-100">Create Add-on</button>
          </div>
        </form>

        <div className="mt-4">
          <DataTable
            columns={[
              { header: 'Add-on', accessor: 'name' },
              { header: 'Price', accessor: 'price', render: (addon) => formatRupees(addon.price), sortValue: (addon) => Number(addon.price || 0) },
              {
                header: 'Action',
                sortable: false,
                searchValue: () => '',
                render: (addon) => (
                  <button type="button" className="btn btn-sm btn-outline-dark rounded-pill" onClick={() => handleDelete(addon)} disabled={!addon.id}>
                    Remove
                  </button>
                )
              }
            ]}
            rows={addons}
            getRowKey={(addon) => addon.id || addon.name}
          />
        </div>

        {message ? <div className="alert alert-success mt-4 mb-0">{message}</div> : null}
        {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}
      </SectionCard>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async () => ({
  props: {
    addons: await getAddons(query).catch(() => [])
  }
}));
