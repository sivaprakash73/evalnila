import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import { formatRupees } from '@/lib/currency';
import { productsPageRows } from '@/lib/dashboard-data';
import { query } from '@/lib/db';
import { getStockRows } from '@/lib/server/stock-service';
import { withPageAuth } from '@/lib/server/with-auth';
import { useState } from 'react';

export default function StockPage({ user, stockRows }) {
  const [rows, setRows] = useState(stockRows);

  const totalStock = rows.reduce((sum, row) => sum + Number(row.stock || 0), 0);
  const lowStock = rows.filter((row) => row.stockStatus !== 'Ready').length;
  const stockValue = rows.reduce((sum, row) => sum + Number(row.stockValue || 0), 0);

  async function handleStockChange(id, value) {
    const stock = Number(value);

    setRows((existing) =>
      existing.map((item) =>
        item.id === id
          ? {
              ...item,
              stock,
              stockValue: stock * Number(item.price || 0),
              stockStatus: stock === 0 ? 'Out of Stock' : stock <= item.reorderLevel ? 'Reorder' : 'Ready'
            }
          : item
      )
    );

    await fetch(`/api/stock/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock })
    });
  }

  return (
    <Layout
      title="Stock Management"
      subtitle="Update ready stock, reorder levels, and product availability."
      user={user}
    >
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <StatCard label="Ready Stock" value={totalStock.toLocaleString()} delta="Units" tone="sea" />
        </div>
        <div className="col-md-4">
          <StatCard label="Stock Alerts" value={lowStock.toLocaleString()} delta="Items" tone="sun" />
        </div>
        <div className="col-md-4">
          <StatCard label="Stock Value" value={formatRupees(stockValue)} delta="Cost" tone="mint" />
        </div>
      </div>

      <SectionCard title="Inventory List" description="Adjust stock counts directly from the admin table.">
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
            {
              header: 'Ready Stock',
              accessor: 'stock',
              sortValue: (row) => Number(row.stock || 0),
              render: (row) => (
                <input
                  className="form-control stock-input"
                  min="0"
                  type="number"
                  value={row.stock}
                  onChange={(event) => handleStockChange(row.id, event.target.value)}
                />
              )
            },
            { header: 'Reorder Level', accessor: 'reorderLevel', sortValue: (row) => Number(row.reorderLevel || 0) },
            {
              header: 'Stock Value',
              accessor: 'stockValue',
              render: (row) => formatRupees(row.stockValue),
              sortValue: (row) => Number(row.stockValue || 0)
            },
            { header: 'Status', accessor: 'stockStatus' }
          ]}
          rows={rows}
          getRowKey={(row) => row.id || row.sku}
        />
      </SectionCard>
    </Layout>
  );
}

export const getServerSideProps = withPageAuth(async () => {
  const stockRows = await getStockRows(query).catch(() =>
    productsPageRows.map((product) => ({
      ...product,
      reorderLevel: 50,
      stockValue: Number(product.stock || 0) * Number(product.price || 0),
      stockStatus: Number(product.stock || 0) < 50 ? 'Reorder' : 'Ready'
    }))
  );

  return {
    props: {
      stockRows
    }
  };
});
