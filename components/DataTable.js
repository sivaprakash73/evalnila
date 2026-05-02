import { useMemo, useState } from 'react';

function getColumnValue(row, column, rowIndex) {
  if (typeof column.accessor === 'function') {
    return column.accessor(row, rowIndex);
  }

  if (typeof column.accessor === 'string') {
    return row?.[column.accessor];
  }

  return '';
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number') {
    return value;
  }

  return String(value).toLowerCase();
}

export default function DataTable({
  columns,
  rows,
  getRowKey,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  searchPlaceholder = 'Search table...'
}) {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ index: null, direction: 'asc' });

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row, rowIndex) =>
      columns.some((column) => {
        const rawValue = column.searchValue
          ? column.searchValue(row, rowIndex)
          : getColumnValue(row, column, rowIndex);

        return String(rawValue ?? '').toLowerCase().includes(query);
      })
    );
  }, [columns, rows, search]);

  const sortedRows = useMemo(() => {
    if (sort.index === null) {
      return filteredRows;
    }

    const column = columns[sort.index];

    return [...filteredRows].sort((left, right) => {
      const leftValue = normalizeValue(
        column.sortValue ? column.sortValue(left) : getColumnValue(left, column)
      );
      const rightValue = normalizeValue(
        column.sortValue ? column.sortValue(right) : getColumnValue(right, column)
      );

      if (leftValue < rightValue) {
        return sort.direction === 'asc' ? -1 : 1;
      }

      if (leftValue > rightValue) {
        return sort.direction === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }, [columns, filteredRows, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const start = sortedRows.length ? (currentPage - 1) * pageSize + 1 : 0;
  const end = Math.min(currentPage * pageSize, sortedRows.length);

  function updateSort(columnIndex, sortable) {
    if (sortable === false) {
      return;
    }

    setPage(1);
    setSort((current) => {
      if (current.index !== columnIndex) {
        return { index: columnIndex, direction: 'asc' };
      }

      return {
        index: columnIndex,
        direction: current.direction === 'asc' ? 'desc' : 'asc'
      };
    });
  }

  return (
    <div className="data-table">
      <div className="data-table-toolbar">
        <label className="data-table-length">
          <span>Show</span>
          <select
            className="form-select form-select-sm"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span>entries</span>
        </label>

        <label className="data-table-search">
          <span>Search</span>
          <input
            className="form-control form-control-sm"
            value={search}
            placeholder={searchPlaceholder}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      <div className="table-responsive">
        <table className="table align-middle custom-table mb-0">
          <thead>
            <tr>
              {columns.map((column, columnIndex) => {
                const active = sort.index === columnIndex;

                return (
                  <th key={column.header} scope="col">
                    <button
                      type="button"
                      className={`data-table-sort ${column.sortable === false ? 'disabled' : ''}`}
                      onClick={() => updateSort(columnIndex, column.sortable)}
                    >
                      <span>{column.header}</span>
                      {column.sortable === false ? null : (
                        <span className={`data-table-sort-icon ${active ? sort.direction : ''}`}>
                          {active ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length ? (
              pageRows.map((row, rowIndex) => {
                const absoluteIndex = (currentPage - 1) * pageSize + rowIndex;

                return (
                  <tr key={getRowKey ? getRowKey(row, absoluteIndex) : absoluteIndex}>
                    {columns.map((column, columnIndex) => (
                      <td key={`${column.header}-${columnIndex}`}>
                        {column.render
                          ? column.render(row, absoluteIndex)
                          : getColumnValue(row, column, absoluteIndex)}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted py-4">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="data-table-footer">
        <div className="data-table-info">
          Showing {start} to {end} of {sortedRows.length} entries
          {filteredRows.length !== rows.length ? ` (filtered from ${rows.length} total)` : ''}
        </div>
        <div className="data-table-pagination">
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(1)}>
            First
          </button>
          <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)}>
            Previous
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
          <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
