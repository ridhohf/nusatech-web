import React from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  keyExtractor: (row: T) => string;
}

export function DataTable<T>({ columns, data, emptyMessage = 'Tidak ada data', keyExtractor }: DataTableProps<T>) {
  return (
    <div className="table-container">
      <table className="data-table" style={{ width: '100%', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{ width: col.width || 'auto', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr key={keyExtractor(row)}>
                {columns.map((col, i) => (
                  <td key={i} style={{ width: col.width || 'auto', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : String(row[col.accessor] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
