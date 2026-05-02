import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import ProductForm from '@/components/ProductForm';
import { categoryRows } from '@/lib/dashboard-data';
import { getCategories } from '@/lib/server/categories-service';
import { getSizes } from '@/lib/server/sizes-service';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';

export default function NewProductPage({ user, categories, sizes }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function handleSubmit(event, form) {
    event.preventDefault();
    setMessage('');
    setError('');

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...form,
        mrp: Number(form.mrp),
        specialPrice: Number(form.specialPrice),
        price: Number(form.specialPrice),
        taxPercentage: Number(form.taxPercentage),
        stock: Number(form.stock),
        availabilityType: form.availabilityType,
        readyStockDispatchDays: Number(form.readyStockDispatchDays),
        makeOrderDispatchDays: Number(form.makeOrderDispatchDays)
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.message || 'Unable to create product.');
      return;
    }

    setMessage(`Product created with ready stock: ${payload.product.name}`);
    setTimeout(() => {
      router.push('/admin/products');
    }, 900);
  }

  return (
    <Layout
      title="Add Product"
      subtitle="Create a new catalog item for Evalnila."
      user={user}
    >
      <SectionCard
        title="New Product"
        description="Add a product with category, pricing, availability, dispatch timing, and description."
      >
        <ProductForm
          mode="create"
          initialValues={{}}
          categories={categories}
          sizes={sizes}
          onSubmit={handleSubmit}
          submitLabel="Create Product"
        />

        {message ? <div className="alert alert-success mt-4 mb-0">{message}</div> : null}
        {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}
      </SectionCard>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async () => {
  const [categories, sizes] = await Promise.all([
    getCategories(query).catch(() => categoryRows),
    getSizes(query).catch(() => [])
  ]);

  return {
    props: {
      categories,
      sizes
    }
  };
});
