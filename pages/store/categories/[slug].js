import Link from 'next/link';
import StoreLayout from '@/components/StoreLayout';
import ProductShowcaseCard from '@/components/ProductShowcaseCard';
import { query } from '@/lib/db';
import { getCategories, getCategoryBySlug } from '@/lib/server/categories-service';
import { getStoreProducts } from '@/lib/server/products-service';

export default function StoreCategoryPage({ category, categories, products }) {
  return (
    <StoreLayout
      title={`${category.name} Collection`}
      description={`Browse ${category.name.toLowerCase()} products from Evalnila.`}
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="section-intro">
            <div>
              <p className="eyebrow mb-2">Category</p>
              <h1 className="section-heading">{category.name}</h1>
              <p className="store-copy mb-0">
                Explore curated {category.name.toLowerCase()} designs from Evalnila Designers.
              </p>
            </div>
            <div className="catalog-summary">
              <strong>{products.length}</strong>
              <span>{products.length === 1 ? 'product' : 'products'} in this category</span>
            </div>
          </div>

          <div className="catalog-toolbar">
            <div className="category-pills">
              <Link href="/store" className="category-pill">
                All Products
              </Link>
              {categories.map((item) => (
                <Link
                  key={item.id || item.slug}
                  href={`/store/categories/${item.slug}`}
                  className={`category-pill ${item.slug === category.slug ? 'active' : ''}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <Link
              href={{ pathname: '/store', query: { category: category.slug } }}
              className="btn btn-outline-dark rounded-pill px-4"
            >
              Search Within {category.name}
            </Link>
          </div>

          {products.length ? (
            <div className="row g-4">
              {products.map((product) => (
                <div className="col-md-6 col-xl-4" key={product.id || product.slug}>
                  <ProductShowcaseCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="page-panel empty-state">
              <p className="eyebrow mb-0">Empty Category</p>
              <h2 className="section-heading mb-0">No products are published here yet.</h2>
              <p className="store-copy mb-0">
                Add more items from the admin panel or switch to another category to keep browsing.
              </p>
              <Link href="/store" className="btn btn-dark rounded-pill px-4">
                Back to Catalog
              </Link>
            </div>
          )}
        </div>
      </section>
    </StoreLayout>
  );
}

export async function getServerSideProps(context) {
  const slug = context.params.slug;
  const [categories, category] = await Promise.all([
    getCategories(query).catch(() => []),
    getCategoryBySlug(query, slug).catch(() => null)
  ]);

  if (!category) {
    return {
      notFound: true
    };
  }

  const products = await getStoreProducts(query, { category: slug }).catch(() => []);

  return {
    props: {
      category,
      categories,
      products
    }
  };
}
