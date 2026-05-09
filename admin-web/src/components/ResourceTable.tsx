import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, errMsg, PageResult } from '../api';

export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
}

interface ResourceTableProps<T extends { id: string }> {
  /** Title shown above the table. */
  title: string;
  subtitle?: string;
  /** Endpoint relative to /api (e.g. '/admin/users'). */
  endpoint: string;
  /** Columns for the table. */
  columns: Column<T>[];
  /** Optional filter UI rendered alongside the search box. */
  filters?: React.ReactNode;
  /** Extra query params merged into the request (e.g. role='seller'). */
  params?: Record<string, string | undefined>;
  /** Where clicking a row should navigate (default: same path + /:id). */
  detailPath?: (id: string) => string;
  /** Page size, default 25. */
  pageSize?: number;
}

/**
 * Reusable list view for any admin resource. Handles paging, search,
 * loading/empty/error states. The parent provides columns + endpoint.
 *
 * Click on any row navigates to detailPath(id) — typically the same
 * resource's /:id detail page.
 */
export function ResourceTable<T extends { id: string }>({
  title,
  subtitle,
  endpoint,
  columns,
  filters,
  params,
  detailPath,
  pageSize = 25,
}: ResourceTableProps<T>) {
  const navigate = useNavigate();
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Reset to page 1 when q or external params change.
  useEffect(() => {
    setPage(1);
  }, [q, JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    apiGet<PageResult<T>>(endpoint, { page, pageSize, q: q || undefined, ...params })
      .then(res => {
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(e => {
        if (cancelled) return;
        setErr(errMsg(e, `Could not load ${title.toLowerCase()}.`));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, page, pageSize, q, JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="row between" style={{ marginBottom: 6 }}>
        <h2>{title}</h2>
        <span className="muted">
          {loading ? '' : `${total.toLocaleString('en-IN')} total`}
        </span>
      </div>
      {subtitle && <p className="subtitle">{subtitle}</p>}

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        {filters}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} style={{ width: c.width }}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: 30 }}>
                  <span className="spinner" />
                </td>
              </tr>
            )}
            {!loading && err && (
              <tr>
                <td colSpan={columns.length} style={{ color: 'var(--error)', textAlign: 'center', padding: 30 }}>
                  {err}
                </td>
              </tr>
            )}
            {!loading && !err && items.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="empty">
                  No matches.
                </td>
              </tr>
            )}
            {!loading && !err &&
              items.map(row => (
                <tr
                  key={row.id}
                  onClick={() => navigate(detailPath ? detailPath(row.id) : `${endpoint.replace('/admin', '')}/${row.id}`)}
                >
                  {columns.map((c, i) => (
                    <td key={i}>{c.render(row)}</td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>
            Page {page} of {totalPages}
          </span>
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Prev
          </button>
          <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </>
  );
}
