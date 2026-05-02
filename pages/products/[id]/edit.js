import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import ProductForm from '@/components/ProductForm';
import { categoryRows, productsPageRows } from '@/lib/dashboard-data';
import { getCategories } from '@/lib/server/categories-service';
import { getProductById } from '@/lib/server/products-service';
import { getSizes } from '@/lib/server/sizes-service';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';

export default function EditProductPage({ user, product, categories, sizes }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event, form) {
    event.preventDefault();
    setMessage('');
    setError('');

    const response = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
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
      setError(payload.message || 'Unable to update product.');
      return;
    }

    setMessage('Product updated.');
    setTimeout(() => router.push('/admin/products'), 700);
  }

  async function handleDelete() {
    const response = await fetch(`/api/products/${product.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      setError('Unable to delete product.');
      return;
    }

    router.push('/admin/products');
  }

  return (
    <Layout
      title="Edit Product"
      subtitle={`Update catalog details for ${product.name}.`}
      user={user}
    >
      <SectionCard
        title="Product Editor"
        description="Maintain pricing, stock, SKU structure, and product metadata."
      >
        <ProductForm
          mode="edit"
          initialValues={product}
          categories={categories}
          sizes={sizes}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
        />

        {message ? <div className="alert alert-success mt-4 mb-0">{message}</div> : null}
        {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}

        <div className="d-flex justify-content-start mt-4">
          <button type="button" className="btn btn-outline-danger rounded-pill px-4" onClick={handleDelete}>
            Delete Product
          </button>
        </div>
      </SectionCard>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async (context) => {
  const { id } = context.params;
  const [product, categories, sizes] = await Promise.all([
    getProductById(query, id).catch(() => productsPageRows.find((item) => String(item.id) === String(id))),
    getCategories(query).catch(() => categoryRows),
    getSizes(query).catch(() => [])
  ]);

  if (!product) {
    return {
      redirect: {
        destination: '/admin/products',
        permanent: false
      }
    };
  }

  return {
    props: {
      product,
      categories,
      sizes
    }
  };
});
