import DataTable from '@/components/DataTable';

export default function SimpleTable({ columns, rows }) {
  return (
    <DataTable
      columns={columns.map((column, index) => ({
        header: column,
        accessor: (row) => row[index]
      }))}
      rows={rows}
      getRowKey={(row, rowIndex) => `${row[0]}-${rowIndex}`}
      initialPageSize={5}
    />
  );
}
