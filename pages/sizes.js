import { useState } from 'react';
import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import { getSizes } from '@/lib/server/sizes-service';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';

export default function SizesPage({ user, sizes: initialSizes }) {
  const [sizes, setSizes] = useState(initialSizes);
  const [form, setForm] = useState({
    label: '',
    bust: '',
    waist: '',
    hip: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateSizeField(sizeId, field, value) {
    setSizes((current) =>
      current.map((size) => (size.id === sizeId ? { ...size, [field]: value } : size))
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    const response = await fetch('/api/sizes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form)
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.message || 'Unable to create size.');
      return;
    }

    setSizes((current) => [...current, payload.size].sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label)));
    setForm({
      label: '',
      bust: '',
      waist: '',
      hip: ''
    });
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

  async function handleUpdate(size) {
    setMessage('');
    setError('');

    const response = await fetch(`/api/sizes/${size.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bust: size.bust || '',
        waist: size.waist || '',
        hip: size.hip || ''
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.message || 'Unable to update size.');
      return;
    }

    setSizes((current) => current.map((item) => (item.id === size.id ? payload.size : item)));
    setMessage(`Size ${payload.size.label} updated.`);
  }

  return (
    <Layout title="Sizes" subtitle="Create clothing sizes for product selection." user={user}>
      <SectionCard title="Size Creation" description="Add labels like M, L, XL, or brand-specific clothing sizes.">
        <form className="row g-3 align-items-end" onSubmit={handleSubmit}>
          <div className="col-md-3">
            <label className="form-label">Size Label</label>
            <input
              className="form-control"
              value={form.label}
              onChange={(event) => updateField('label', event.target.value)}
              placeholder="M, L, XL"
              required
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Bust (in)</label>
            <input
              className="form-control"
              min="0"
              step="0.1"
              type="number"
              value={form.bust}
              onChange={(event) => updateField('bust', event.target.value)}
              placeholder="38"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Waist (in)</label>
            <input
              className="form-control"
              min="0"
              step="0.1"
              type="number"
              value={form.waist}
              onChange={(event) => updateField('waist', event.target.value)}
              placeholder="32"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Hip (in)</label>
            <input
              className="form-control"
              min="0"
              step="0.1"
              type="number"
              value={form.hip}
              onChange={(event) => updateField('hip', event.target.value)}
              placeholder="42"
            />
          </div>
          <div className="col-md-3">
            <button type="submit" className="btn btn-dark rounded-pill px-4 w-100">
              Create Size
            </button>
          </div>
        </form>

        <div className="size-chip-grid mt-4">
          {sizes.map((size) => (
            <div className="size-admin-chip" key={size.id || size.label}>
              <strong>{size.label}</strong>
              <label>
                <span>Bust</span>
                <input
                  className="form-control form-control-sm"
                  min="0"
                  step="0.1"
                  type="number"
                  value={size.bust || ''}
                  onChange={(event) => updateSizeField(size.id, 'bust', event.target.value)}
                />
              </label>
              <label>
                <span>Waist</span>
                <input
                  className="form-control form-control-sm"
                  min="0"
                  step="0.1"
                  type="number"
                  value={size.waist || ''}
                  onChange={(event) => updateSizeField(size.id, 'waist', event.target.value)}
                />
              </label>
              <label>
                <span>Hip</span>
                <input
                  className="form-control form-control-sm"
                  min="0"
                  step="0.1"
                  type="number"
                  value={size.hip || ''}
                  onChange={(event) => updateSizeField(size.id, 'hip', event.target.value)}
                />
              </label>
              {getSizeMeasurementText(size) ? (
                <small>To Fit {getSizeMeasurementText(size)}</small>
              ) : null}
              <button type="button" onClick={() => handleUpdate(size)} disabled={!size.id}>
                Save
              </button>
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

function getSizeMeasurementText(size) {
  return [
    size.bust ? `Bust - ${formatMeasurement(size.bust)}in` : '',
    size.waist ? `Waist - ${formatMeasurement(size.waist)}in` : '',
    size.hip ? `Hip - ${formatMeasurement(size.hip)}in` : ''
  ]
    .filter(Boolean)
    .join(' | ');
}

function formatMeasurement(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toString().replace(/\.0$/, '') : value;
}
