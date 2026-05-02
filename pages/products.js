import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
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
        <div className="table-responsive">
          <table className="table align-middle custom-table mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Availability</th>
                <th>Sizes</th>
                <th>MRP / Special Price</th>
                <th>Tax</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((row) => (
                <tr key={row.id || row.sku}>
                  <td>
                    <div className="product-table-name">
                      <div className="product-table-thumb">
                        {row.imageUrl ? <img src={row.imageUrl} alt={row.name} /> : <span>{row.name.charAt(0)}</span>}
                      </div>
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td>{row.sku}</td>
                  <td>{row.category}</td>
                  <td>{row.stock}</td>
                  <td>
                    <div>{row.availabilityLabel}</div>
                    <div className="small text-muted">
                      {row.dispatchDays} {Number(row.dispatchDays) === 1 ? 'day' : 'days'}
                    </div>
                  </td>
                  <td>{row.sizes?.length ? row.sizes.join(', ') : '-'}</td>
                  <td>
                    <ProductPrice product={row} />
                  </td>
                  <td>{Number(row.taxPercentage || 0)}%</td>
                  <td>{row.status}</td>
                  <td>
                    <Link href={`/admin/products/${row.id}/edit`} className="btn btn-sm btn-outline-dark rounded-pill">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
