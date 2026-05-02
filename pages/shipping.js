import { useState } from 'react';
import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';
import { getShippingSettings } from '@/lib/server/shipping-service';

export default function ShippingPage({ user, settings }) {
  const [form, setForm] = useState({
    shippingAmount: settings.shippingAmount,
    freeShippingMinimum: settings.freeShippingMinimum
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/shipping-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shippingAmount: Number(form.shippingAmount),
          freeShippingMinimum: Number(form.freeShippingMinimum)
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to save shipping settings.');
      }

      setForm(payload.settings);
      setMessage('Shipping settings saved.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save shipping settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout
      title="Shipping"
      subtitle="Manage storefront delivery charge and free delivery threshold."
      user={user}
    >
      <SectionCard
        title="Shipping Charge"
        description="Set the delivery amount and the minimum order value that receives free delivery."
      >
        <form onSubmit={saveSettings}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Shipping Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                value={form.shippingAmount}
                onChange={(event) => setForm((current) => ({ ...current, shippingAmount: event.target.value }))}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Free Delivery From</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                value={form.freeShippingMinimum}
                onChange={(event) => setForm((current) => ({ ...current, freeShippingMinimum: event.target.value }))}
                required
              />
            </div>
          </div>

          {message ? <div className="alert alert-success mt-4 mb-0">{message}</div> : null}
          {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}

          <div className="d-flex justify-content-end mt-4">
            <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={saving}>
              {saving ? 'Saving...' : 'Save Shipping Settings'}
            </button>
          </div>
        </form>
      </SectionCard>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async () => ({
  props: {
    settings: await getShippingSettings(query)
  }
}));
