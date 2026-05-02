import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import DataTable from '@/components/DataTable';
import { productsPageRows } from '@/lib/dashboard-data';
import { getProducts } from '@/lib/server/products-service';
import { query } from '@/lib/db';
import Link from 'next/link';
import { withPageAuth } from '@/lib/server/with-auth';
import ProductPrice from '@/components/ProductPrice';

export default function ProductsPage({ user, products }) {
  return (
    <Layout
      title="Products"
      subtitle="Monitor inventory, pricing, and catalog readiness."
      user={user}
    >
      <div className="d-flex justify-content-end mb-4">
        <Link href="/admin/products/new" className="btn btn-dark rounded-pill px-4">
          Add Product
        </Link>
      </div>

      <SectionCard
        title="Product Catalog"
        description="Core product management view backed by the MySQL schema."
      >
        <DataTable
          columns={[
            {
              header: 'Product',
              accessor: 'name',
              render: (row) => (
                <div className="product-table-name">
                  <div className="product-table-thumb">
                    {row.imageUrl ? <img src={row.imageUrl} alt={row.name} /> : <span>{row.name.charAt(0)}</span>}
                  </div>
                  <span>{row.name}</span>
                </div>
              )
            },
            { header: 'SKU', accessor: 'sku' },
            { header: 'Category', accessor: 'category' },
            { header: 'Stock', accessor: 'stock', sortValue: (row) => Number(row.stock || 0) },
            {
              header: 'Availability',
              accessor: 'availabilityLabel',
              render: (row) => (
                <>
                  <div>{row.availabilityLabel}</div>
                  <div className="small text-muted">
                    {row.dispatchDays} {Number(row.dispatchDays) === 1 ? 'day' : 'days'}
                  </div>
                </>
              ),
              searchValue: (row) => `${row.availabilityLabel || ''} ${row.dispatchDays || ''}`
            },
            {
              header: 'Sizes',
              accessor: (row) => (row.sizes?.length ? row.sizes.join(', ') : '-')
            },
            {
              header: 'MRP / Special Price',
              accessor: (row) => `${row.mrp || ''} ${row.price || ''}`,
              render: (row) => <ProductPrice product={row} />,
              sortValue: (row) => Number(row.price || row.mrp || 0)
            },
            {
              header: 'Tax',
              accessor: 'taxPercentage',
              render: (row) => `${Number(row.taxPercentage || 0)}%`,
              sortValue: (row) => Number(row.taxPercentage || 0)
            },
            { header: 'Status', accessor: 'status' },
            {
              header: 'Action',
              sortable: false,
              searchValue: () => '',
              render: (row) => (
                <Link href={`/admin/products/${row.id}/edit`} className="btn btn-sm btn-outline-dark rounded-pill">
                  Edit
                </Link>
              )
            }
          ]}
          rows={products}
          getRowKey={(row) => row.id || row.sku}
        />
      </SectionCard>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async () => {
  const products = await getProducts(query).catch(() => productsPageRows);

  return {
    props: {
      products
    }
  };
});
