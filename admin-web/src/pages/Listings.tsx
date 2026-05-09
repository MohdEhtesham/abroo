import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiDelete, apiGet, apiPut, errMsg } from '../api';
import { ResourceTable, Column } from '../components/ResourceTable';

interface AdminListing {
  id: string;
  title: string;
  builder?: string;
  city?: string;
  locality?: string;
  status: 'live' | 'draft' | 'paused' | 'sold' | 'review';
  type?: string;
  priceMin?: number;
  priceMax?: number;
  configuration?: string[];
  isUserListing?: boolean;
  ownerId?: string;
  views?: number;
  inquiriesCount?: number;
  createdAt: string;
  description?: string;
}

const statusPill = (s: AdminListing['status']) => {
  const cls =
    s === 'live'
      ? 'pill-success'
      : s === 'paused'
      ? 'pill-warning'
      : s === 'sold'
      ? 'pill-info'
      : s === 'review'
      ? 'pill-warning'
      : 'pill-muted';
  return <span className={`pill ${cls}`}>{s}</span>;
};

const inr = (n?: number) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

export const ListingsList: React.FC = () => {
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const params = {
    status: status || undefined,
    isUserListing: source || undefined,
  };

  const columns: Column<AdminListing>[] = [
    { header: 'Title', render: l => <strong>{l.title}</strong> },
    { header: 'Builder', render: l => l.builder ?? <span className="muted">—</span> },
    { header: 'Location', render: l => [l.locality, l.city].filter(Boolean).join(', ') || '—' },
    { header: 'Price', render: l => inr(l.priceMin) },
    { header: 'Status', render: l => statusPill(l.status), width: '90px' },
    {
      header: 'Source',
      render: l =>
        l.isUserListing ? (
          <span className="pill pill-info">user</span>
        ) : (
          <span className="pill pill-muted">seed</span>
        ),
      width: '90px',
    },
    {
      header: 'Created',
      render: l => new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      width: '110px',
    },
  ];

  return (
    <ResourceTable<AdminListing>
      title="Listings"
      subtitle="Every property posted on Aabroo — both seed/admin listings and user-posted ones."
      endpoint="/admin/listings"
      columns={columns}
      params={params}
      detailPath={id => `/listings/${id}`}
      filters={
        <>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Any status</option>
            <option value="live">Live</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="sold">Sold</option>
            <option value="review">In review</option>
          </select>
          <select value={source} onChange={e => setSource(e.target.value)}>
            <option value="">All sources</option>
            <option value="true">User-posted</option>
            <option value="false">Seed/admin</option>
          </select>
        </>
      }
    />
  );
};

export const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<AdminListing | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<AdminListing['status']>('live');

  useEffect(() => {
    if (!id) return;
    apiGet<AdminListing>(`/admin/listings/${id}`)
      .then(l => {
        setItem(l);
        setStatus(l.status);
      })
      .catch(e => setErr(errMsg(e, 'Could not load listing.')));
  }, [id]);

  if (err) return <div className="card" style={{ color: 'var(--error)' }}>{err}</div>;
  if (!item) return <div className="card"><span className="spinner" /></div>;

  const save = async () => {
    setBusy(true);
    try {
      const updated = await apiPut<AdminListing>(`/admin/listings/${item.id}`, { status });
      setItem(updated);
      alert('Listing status updated.');
    } catch (e) {
      alert(errMsg(e, 'Could not save changes.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete listing "${item.title}"?`)) return;
    setBusy(true);
    try {
      await apiDelete(`/admin/listings/${item.id}`);
      alert('Listing deleted.');
      navigate('/listings');
    } catch (e) {
      alert(errMsg(e, 'Could not delete listing.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <h2>{item.title}</h2>
        <Link to="/listings" className="btn btn-sm">← Back to listings</Link>
      </div>
      <p className="subtitle mono">{item.id}</p>

      <div className="detail-grid">
        <div className="card">
          <div className="field-row">
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as AdminListing['status'])}>
              <option value="live">Live</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="sold">Sold</option>
              <option value="review">In review</option>
            </select>
          </div>
          <div className="field-row">
            <label>Builder</label>
            <span className="value">{item.builder ?? '—'}</span>
          </div>
          <div className="field-row">
            <label>Location</label>
            <span className="value">{[item.locality, item.city].filter(Boolean).join(', ') || '—'}</span>
          </div>
          <div className="field-row">
            <label>Price range</label>
            <span className="value">{inr(item.priceMin)} – {inr(item.priceMax ?? item.priceMin)}</span>
          </div>
          <div className="field-row">
            <label>Configuration</label>
            <span className="value">{item.configuration?.join(', ') || '—'}</span>
          </div>
          <div className="field-row">
            <label>Description</label>
            <span className="value" style={{ whiteSpace: 'pre-wrap' }}>{item.description ?? '—'}</span>
          </div>

          <div className="row" style={{ marginTop: 16, gap: 10 }}>
            <button className="btn btn-primary" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save status'}
            </button>
            <button className="btn btn-danger" onClick={remove} disabled={busy}>
              Delete listing
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14, color: 'var(--text-muted)' }}>Engagement</h3>
          <div className="field-row">
            <label>Views</label>
            <span className="value">{item.views ?? 0}</span>
          </div>
          <div className="field-row">
            <label>Inquiries</label>
            <span className="value">{item.inquiriesCount ?? 0}</span>
          </div>
          <div className="field-row">
            <label>Source</label>
            <span className="value">{item.isUserListing ? 'User-posted' : 'Seed/admin'}</span>
          </div>
          {item.ownerId && (
            <div className="field-row">
              <label>Owner</label>
              <Link to={`/users/${item.ownerId}`} className="mono">{item.ownerId}</Link>
            </div>
          )}
          <div className="field-row">
            <label>Created</label>
            <span className="value">{new Date(item.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </>
  );
};
