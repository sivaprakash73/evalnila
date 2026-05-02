import Link from 'next/link';
import StoreLayout from '@/components/StoreLayout';
import ProductShowcaseCard from '@/components/ProductShowcaseCard';
import { getCategories } from '@/lib/server/categories-service';
import { getPaginatedStoreProducts, getStoreCatalogMeta } from '@/lib/server/products-service';
import { query } from '@/lib/db';
import { formatRupees } from '@/lib/currency';

const sortOptions = [
  { value: 'latest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' }
];

function buildStoreQuery(filters, overrides = {}) {
  const next = {
    ...(filters.search ? { q: filters.search } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.sort && filters.sort !== 'latest' ? { sort: filters.sort } : {}),
    ...(filters.minPrice ? { minPrice: filters.minPrice } : {}),
    ...(filters.maxPrice ? { maxPrice: filters.maxPrice } : {}),
    ...overrides
  };

  Object.keys(next).forEach((key) => {
    if (next[key] === '' || next[key] === null || next[key] === undefined) {
      delete next[key];
    }
  });

  return next;
}

export default function StorePage({ products, categories, filters, priceBounds, pagination }) {
  const hasFilters = Boolean(
    filters.search || filters.category || filters.minPrice || filters.maxPrice || filters.sort !== 'latest'
  );

  return (
    <StoreLayout
      title="Shop"
      description="Browse Evalnila womenswear designs and custom stitching categories."
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="section-intro">
            <div>
              <p className="eyebrow mb-2">Catalog</p>
              <h1 className="section-heading">Shop the Evalnila collection</h1>
              <p className="store-copy mb-0">
                Browse kurtis, maxis, co-ords, crop-skirt sets, western wear, and saree styles.
              </p>
            </div>
            <div className="catalog-summary">
              <strong>{pagination.totalItems}</strong>
              <span>{pagination.totalItems === 1 ? 'product' : 'products'} available</span>
            </div>
          </div>

          <div className="catalog-toolbar">
            <form method="get" action="/store" className="catalog-search-form">
              <input
                type="search"
                name="q"
                className="form-control form-control-lg"
                placeholder="Search products, SKU, or category"
                defaultValue={filters.search}
              />
              {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
              {filters.sort ? <input type="hidden" name="sort" value={filters.sort} /> : null}
              {filters.minPrice ? <input type="hidden" name="minPrice" value={filters.minPrice} /> : null}
              {filters.maxPrice ? <input type="hidden" name="maxPrice" value={filters.maxPrice} /> : null}
              <button type="submit" className="btn btn-dark rounded-pill px-4">
                Search
              </button>
            </form>

            <div className="category-pills">
              <Link href="/store" className={`category-pill ${!filters.category ? 'active' : ''}`}>
                All
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id || category.slug}
                  href={{
                    pathname: '/store',
                    query: buildStoreQuery(filters, { category: category.slug, page: 1 })
                  }}
                  className={`category-pill ${filters.category === category.slug ? 'active' : ''}`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <form method="get" action="/store" className="catalog-controls-panel">
            <input type="hidden" name="q" value={filters.search} />
            <input type="hidden" name="category" value={filters.category} />
            <div className="catalog-control-grid">
              <label className="catalog-control">
                <span>Sort By</span>
                <select name="sort" className="form-select" defaultValue={filters.sort}>
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="catalog-control">
                <span>Min Price</span>
                <input
                  type="number"
                  name="minPrice"
                  min={priceBounds.minPrice}
                  max={priceBounds.maxPrice}
                  defaultValue={filters.minPrice}
                  placeholder={`${priceBounds.minPrice}`}
                  className="form-control"
                />
              </label>
              <label className="catalog-control">
                <span>Max Price</span>
                <input
                  type="number"
                  name="maxPrice"
                  min={priceBounds.minPrice}
                  max={priceBounds.maxPrice}
                  defaultValue={filters.maxPrice}
                  placeholder={`${priceBounds.maxPrice}`}
                  className="form-control"
                />
              </label>
              <div className="catalog-actions">
                <button type="submit" className="btn btn-dark rounded-pill px-4">
                  Apply Filters
                </button>
                <Link href="/store" className="btn btn-outline-dark rounded-pill px-4">
                  Reset
                </Link>
              </div>
            </div>
          </form>

          {hasFilters ? (
            <div className="filter-feedback">
              <span>
                Showing {pagination.startItem}-{pagination.endItem} of {pagination.totalItems} results
                {filters.search ? ` for "${filters.search}"` : ''}
                {filters.categoryLabel ? ` in ${filters.categoryLabel}` : ''}
                {filters.minPrice ? ` from ${formatRupees(filters.minPrice)}` : ''}
                {filters.maxPrice ? ` up to ${formatRupees(filters.maxPrice)}` : ''}
                {filters.sortLabel ? ` sorted by ${filters.sortLabel}` : ''}
              </span>
              <Link href="/store" className="btn btn-outline-dark rounded-pill px-4">
                Clear Filters
              </Link>
            </div>
          ) : null}

          {products.length ? (
            <>
              <div className="row g-4">
                {products.map((product) => (
                  <div className="col-md-6 col-xl-4" key={product.id || product.slug}>
                    <ProductShowcaseCard product={product} />
                  </div>
                ))}
              </div>

              {pagination.totalPages > 1 ? (
                <div className="catalog-pagination">
                  <Link
                    href={{
                      pathname: '/store',
                      query: buildStoreQuery(filters, { page: Math.max(1, pagination.page - 1) })
                    }}
                    className={`pagination-pill ${pagination.page === 1 ? 'disabled' : ''}`}
                    aria-disabled={pagination.page === 1}
                  >
                    Previous
                  </Link>

                  <div className="pagination-pages">
                    {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                      <Link
                        key={pageNumber}
                        href={{
                          pathname: '/store',
                          query: buildStoreQuery(filters, { page: pageNumber })
                        }}
                        className={`pagination-pill ${pagination.page === pageNumber ? 'active' : ''}`}
                      >
                        {pageNumber}
                      </Link>
                    ))}
                  </div>

                  <Link
                    href={{
                      pathname: '/store',
                      query: buildStoreQuery(filters, { page: Math.min(pagination.totalPages, pagination.page + 1) })
                    }}
                    className={`pagination-pill ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}
                    aria-disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Link>
                </div>
              ) : null}
            </>
          ) : (
            <div className="page-panel empty-state">
              <p className="eyebrow mb-0">No Match</p>
              <h2 className="section-heading mb-0">No products matched these filters.</h2>
              <p className="store-copy mb-0">
                Try a broader keyword or switch to another category to explore the Evalnila catalog.
              </p>
              <Link href="/store" className="btn btn-dark rounded-pill px-4">
                Reset Catalog
              </Link>
            </div>
          )}
        </div>
      </section>
    </StoreLayout>
  );
}

export async function getServerSideProps(context) {
  const search = String(context.query.q || '').trim();
  const category = String(context.query.category || '').trim();
  const sort = String(context.query.sort || 'latest').trim() || 'latest';
  const minPrice = String(context.query.minPrice || '').trim();
  const maxPrice = String(context.query.maxPrice || '').trim();
  const page = Math.max(1, Number(context.query.page) || 1);
  const [catalog, categories, priceBounds] = await Promise.all([
    getPaginatedStoreProducts(query, { search, category, sort, minPrice, maxPrice, page, pageSize: 6 }).catch(
      () => ({
        items: [],
        pagination: {
          page: 1,
          pageSize: 6,
          totalItems: 0,
          totalPages: 1,
          startItem: 0,
          endItem: 0
        }
      })
    ),
    getCategories(query).catch(() => []),
    getStoreCatalogMeta(query).catch(() => ({ minPrice: 0, maxPrice: 0 }))
  ]);
  const activeCategory = categories.find((item) => item.slug === category) || null;
  const activeSort = sortOptions.find((option) => option.value === sort) || sortOptions[0];

  return {
    props: {
      products: catalog.items,
      categories,
      priceBounds,
      pagination: catalog.pagination,
      filters: {
        search,
        category,
        sort,
        sortLabel: activeSort.label,
        minPrice,
        maxPrice,
        categoryLabel: activeCategory?.name || ''
      }
    }
  };
}
