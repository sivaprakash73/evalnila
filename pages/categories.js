import { useState } from 'react';
import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import DataTable from '@/components/DataTable';
import { getCategories, slugifyCategoryName } from '@/lib/server/categories-service';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';

export default function CategoriesPage({ user, categories: initialCategories }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateName(value) {
    setName(value);
    setSlug((current) => current || slugifyCategoryName(value));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, slug })
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.message || 'Unable to create category.');
      return;
    }

    setCategories((current) =>
      [...current, payload.category].sort((left, right) => left.name.localeCompare(right.name))
    );
    setName('');
    setSlug('');
    setMessage(`Category ${payload.category.name} created.`);
  }

  async function handleDelete(category) {
    setMessage('');
    setError('');

    const response = await fetch(`/api/categories/${category.id}`, { method: 'DELETE' });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.message || 'Unable to remove category.');
      return;
    }

    setCategories((current) => current.filter((item) => item.id !== category.id));
    setMessage(`Category ${category.name} removed.`);
  }

  return (
    <Layout title="Categories" subtitle="Create product categories used by catalog items and storefront filters." user={user}>
      <SectionCard title="Category Creation" description="Add categories before assigning products in the catalog form.">
        <form className="row g-3 align-items-end" onSubmit={handleSubmit}>
          <div className="col-md-5">
            <label className="form-label">Category Name</label>
            <input
              className="form-control"
              value={name}
              onChange={(event) => updateName(event.target.value)}
              placeholder="Kurtis"
              required
            />
          </div>
          <div className="col-md-5">
            <label className="form-label">URL Slug</label>
            <input
              className="form-control"
              value={slug}
              onChange={(event) => setSlug(slugifyCategoryName(event.target.value))}
              placeholder="kurtis"
              required
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-dark rounded-pill px-4 w-100">
              Create
            </button>
          </div>
        </form>

        <div className="mt-4">
          <DataTable
            columns={[
              { header: 'Category', accessor: 'name' },
              { header: 'Slug', accessor: 'slug' },
              {
                header: 'Products',
                accessor: 'productCount',
                render: (category) => Number(category.productCount || 0),
                sortValue: (category) => Number(category.productCount || 0)
              },
              {
                header: 'Action',
                sortable: false,
                searchValue: () => '',
                render: (category) => (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark rounded-pill"
                    disabled={!category.id || Number(category.productCount || 0) > 0}
                    onClick={() => handleDelete(category)}
                  >
                    Remove
                  </button>
                )
              }
            ]}
            rows={categories}
            getRowKey={(category) => category.id || category.slug}
          />
        </div>

        {message ? <div className="alert alert-success mt-4 mb-0">{message}</div> : null}
        {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}
      </SectionCard>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async () => {
  const categories = await getCategories(query).catch(() => []);

  return {
    props: {
      categories
    }
  };
});
