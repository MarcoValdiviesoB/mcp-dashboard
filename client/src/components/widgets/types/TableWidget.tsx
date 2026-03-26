import { useState } from 'react';
import { cn } from '../../../lib/utils';

interface TableColumn {
  key: string;
  label: string;
  type?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface TableData {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
}

export function TableWidget({ data, config }: { data: TableData; config?: any }) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const pageSize = config?.pageSize ?? 20;
  const [page, setPage] = useState(0);

  if (!data.columns?.length) {
    return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No columns</div>;
  }

  let rows = [...(data.rows ?? [])];
  if (sortKey) {
    rows.sort((a, b) => {
      const va = a[sortKey] as any;
      const vb = b[sortKey] as any;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  const totalPages = Math.ceil(rows.length / pageSize);
  const pagedRows = rows.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              {data.columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => (col.sortable !== false) && handleSort(col.key)}
                  className={cn(
                    'px-2 py-1.5 font-medium text-zinc-400 whitespace-nowrap sticky top-0 bg-zinc-900',
                    col.sortable !== false && 'cursor-pointer hover:text-zinc-200',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                  )}
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, i) => (
              <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                {data.columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-2 py-1.5 text-zinc-300 whitespace-nowrap',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    )}
                  >
                    {String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-zinc-500">
          <span>{rows.length} rows</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2 py-0.5 rounded bg-zinc-800 disabled:opacity-30">Prev</button>
            <span className="px-2 py-0.5">{page + 1}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-2 py-0.5 rounded bg-zinc-800 disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
