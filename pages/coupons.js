import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import { formatRupees } from '@/lib/currency';
import { query } from '@/lib/db';
import { getCoupons } from '@/lib/server/coupons-service';
import { withPageAuth } from '@/lib/server/with-auth';
import { useState } from 'react';

const emptyForm = {
  code: '',
  type: 'percentage',
  discountValue: '',
  minimumOrderAmount: '',
  usageLimit: '',
  startsAt: '',
  endsAt: ''
};

export default function CouponsPage({ user, coupons }) {
  const [rows, setRows] = useState(coupons);
  const [form, setForm] = useState(emptyForm);
  const activeCoupons = rows.filter((coupon) => coupon.isActive).length;
  const totalUsage = rows.reduce((sum, coupon) => sum + Number(coupon.usedCount || 0), 0);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    const response = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    setRows((existing) => [payload.coupon, ...existing]);
    setForm(emptyForm);
  }

  async function handleToggle(id, isActive) {
    const response = await fetch(`/api/coupons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    });

    if (!response.ok) {
      return;
    }

    setRows((existing) => existing.map((item) => (item.id === id ? { ...item, isActive } : item)));
  }

  async function handleDelete(id) {
    const response = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });

    if (!response.ok) {
      return;
    }

    setRows((existing) => existing.filter((item) => item.id !== id));
  }

  return (
    <Layout
      title="Coupon Management"
      subtitle="Create offers, set limits, and control active promotion codes."
      user={user}
    >
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <StatCard label="Active Coupons" value={activeCoupons.toLocaleString()} delta="Live" tone="sea" />
        </div>
        <div className="col-md-4">
          <StatCard label="Total Redemptions" value={totalUsage.toLocaleString()} delta="Used" tone="mint" />
        </div>
        <div className="col-md-4">
          <StatCard label="All Coupons" value={rows.length.toLocaleString()} delta="Codes" tone="berry" />
        </div>
      </div>

      <SectionCard title="Create Coupon" description="Add a coupon code with discount, minimum order, and validity.">
        <form className="coupon-form" onSubmit={handleCreate}>
          <input className="form-control" placeholder="Code" value={form.code} onChange={(event) => updateField('code', event.target.value)} />
          <select className="form-select" value={form.type} onChange={(event) => updateField('type', event.target.value)}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
          <input className="form-control" placeholder="Discount" type="number" min="0" value={form.discountValue} onChange={(event) => updateField('discountValue', event.target.value)} />
          <input className="form-control" placeholder="Minimum order" type="number" min="0" value={form.minimumOrderAmount} onChange={(event) => updateField('minimumOrderAmount', event.target.value)} />
          <input className="form-control" placeholder="Usage limit" type="number" min="1" value={form.usageLimit} onChange={(event) => updateField('usageLimit', event.target.value)} />
          <input className="form-control" type="date" value={form.startsAt} onChange={(event) => updateField('startsAt', event.target.value)} />
          <input className="form-control" type="date" value={form.endsAt} onChange={(event) => updateField('endsAt', event.target.value)} />
          <button className="btn btn-dark rounded-pill px-4" type="submit">Add</button>
        </form>
      </SectionCard>

      <SectionCard title="Coupon List" description="Manage currently configured promotional codes.">
        <DataTable
          columns={[
            {
              header: 'Code',
              accessor: 'code',
              render: (coupon) => <span className="fw-semibold">{coupon.code}</span>
            },
            {
              header: 'Discount',
              accessor: (coupon) => `${coupon.type} ${coupon.discountValue}`,
              render: (coupon) =>
                coupon.type === 'percentage' ? `${coupon.discountValue}%` : formatRupees(coupon.discountValue),
              sortValue: (coupon) => Number(coupon.discountValue || 0)
            },
            {
              header: 'Minimum Order',
              accessor: 'minimumOrderAmount',
              render: (coupon) => formatRupees(coupon.minimumOrderAmount),
              sortValue: (coupon) => Number(coupon.minimumOrderAmount || 0)
            },
            {
              header: 'Usage',
              accessor: (coupon) => `${coupon.usedCount || 0}${coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}`,
              sortValue: (coupon) => Number(coupon.usedCount || 0)
            },
            { header: 'Valid Till', accessor: (coupon) => coupon.endsAt || 'Open' },
            { header: 'Status', accessor: (coupon) => (coupon.isActive ? 'Active' : 'Paused') },
            {
              header: 'Action',
              sortable: false,
              searchValue: () => '',
              render: (coupon) => (
                <div className="d-flex gap-2 flex-wrap">
                  <button className="btn btn-sm btn-outline-dark rounded-pill" type="button" onClick={() => handleToggle(coupon.id, !coupon.isActive)}>
                    {coupon.isActive ? 'Pause' : 'Activate'}
                  </button>
                  <button className="btn btn-sm btn-outline-danger rounded-pill" type="button" onClick={() => handleDelete(coupon.id)}>
                    Delete
                  </button>
                </div>
              )
            }
          ]}
          rows={rows}
          getRowKey={(coupon) => coupon.id || coupon.code}
        />
      </SectionCard>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async () => {
  const coupons = await getCoupons(query).catch(() => []);

  return {
    props: {
      coupons
    }
  };
});
