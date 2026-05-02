import { useState } from 'react';
import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import { getSizes } from '@/lib/server/sizes-service';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';

export default function SizesPage({ user, sizes: initialSizes }) {
  const [sizes, setSizes] = useState(initialSizes);
  const [label, setLabel] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    const response = await fetch('/api/sizes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ label })
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.message || 'Unable to create size.');
      return;
    }

    setSizes((current) => [...current, payload.size].sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label)));
    setLabel('');
    setMessage(`Size ${payload.size.label} created.`);
  }

  async function handleDelete(id) {
    const response = await fetch(`/api/sizes/${id}`, { method: 'DELETE' });

    if (!response.ok) {
      setError('Unable to delete size.');
      return;
    }

    setSizes((current) => current.filter((size) => size.id !== id));
    setMessage('Size removed.');
  }

  return (
    <Layout title="Sizes" subtitle="Create clothing sizes for product selection." user={user}>
      <SectionCard title="Size Creation" description="Add labels like M, L, XL, or brand-specific clothing sizes.">
        <form className="row g-3 align-items-end" onSubmit={handleSubmit}>
          <div className="col-md-8">
            <label className="form-label">Size Label</label>
            <input
              className="form-control"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="M, L, XL"
              required
            />
          </div>
          <div className="col-md-4">
            <button type="submit" className="btn btn-dark rounded-pill px-4 w-100">
              Create Size
            </button>
          </div>
        </form>

        <div className="size-chip-grid mt-4">
          {sizes.map((size) => (
            <div className="size-admin-chip" key={size.id || size.label}>
              <span>{size.label}</span>
              <button type="button" onClick={() => handleDelete(size.id)} disabled={!size.id}>
                Remove
              </button>
            </div>
          ))}
        </div>

        {message ? <div className="alert alert-success mt-4 mb-0">{message}</div> : null}
        {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}
      </SectionCard>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async () => {
  const sizes = await getSizes(query).catch(() => []);

  return {
    props: {
      sizes
    }
  };
});
