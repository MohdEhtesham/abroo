import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiDelete, apiGet, errMsg } from '../api';
import { ResourceTable, Column } from '../components/ResourceTable';

interface RefUser {
  _id: string;
  fullName?: string;
  phone?: string;
  email?: string;
}

interface AdminVisit {
  _id: string;
  id?: string;
  consumerId?: string | RefUser;
  propertyOwnerId?: string | RefUser;
  propertyId: string;
  propertyTitle?: string;
  propertyLocation?: string;
  date: string;
  timeSlot?: string;
  mode: 'in_person' | 'virtual';
  status: 'upcoming' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: string;
}

const statusPill = (s: AdminVisit['status']) => {
  const map: Record<AdminVisit['status'], string> = {
    upcoming: 'pill-info',
    completed: 'pill-success',
    cancelled: 'pill-error',
    rescheduled: 'pill-warning',
  };
  return <span className={`pill ${map[s]}`}>{s}</span>;
};

const buyerName = (v: AdminVisit) => {
  const c = v.consumerId;
  if (typeof c === 'object' && c) return c.fullName ?? '—';
  return '—';
};
// Mongo populates with _id; the controller sends raw toObject() so id may be _id.
const visitId = (v: AdminVisit) => v.id ?? String(v._id);

export const VisitsList: React.FC = () => {
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('');
  const params = {
    status: status || undefined,
    mode: mode || undefined,
  };

  const columns: Column<AdminVisit & { id: string }>[] = [
    { header: 'Buyer', render: v => <strong>{buyerName(v)}</strong> },
    { header: 'Listing', render: v => v.propertyTitle ?? '—' },
    {
      header: 'Date',
      render: v => new Date(v.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      width: '130px',
    },
    { header: 'Slot', render: v => v.timeSlot ?? '—', width: '160px' },
    {
      header: 'Mode',
      render: v => (
        <span className={`pill ${v.mode === 'virtual' ? 'pill-info' : 'pill-muted'}`}>
          {v.mode === 'virtual' ? 'virtual' : 'in-person'}
        </span>
      ),
      width: '110px',
    },
    { header: 'Status', render: v => statusPill(v.status), width: '110px' },
  ];

  return (
    <ResourceTable<AdminVisit & { id: string }>
      title="Visits"
      subtitle="Every site visit booked on the platform — including virtual tours."
      endpoint="/admin/visits"
      columns={columns}
      params={params}
      detailPath={id => `/visits/${id}`}
      filters={
        <>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Any status</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </select>
          <select value={mode} onChange={e => setMode(e.target.value)}>
            <option value="">Any mode</option>
            <option value="in_person">In-person</option>
            <option value="virtual">Virtual</option>
          </select>
        </>
      }
    />
  );
};

export const VisitDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [v, setV] = useState<AdminVisit | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiGet<AdminVisit>(`/admin/visits/${id}`)
      .then(setV)
      .catch(e => setErr(errMsg(e, 'Could not load visit.')));
  }, [id]);

  if (err) return <div className="card" style={{ color: 'var(--error)' }}>{err}</div>;
  if (!v) return <div className="card"><span className="spinner" /></div>;

  const remove = async () => {
    if (!confirm('Delete this visit?')) return;
    setBusy(true);
    try {
      await apiDelete(`/admin/visits/${visitId(v)}`);
      alert('Visit deleted.');
      navigate('/visits');
    } catch (e) {
      alert(errMsg(e, 'Could not delete visit.'));
    } finally {
      setBusy(false);
    }
  };

  const buyer = typeof v.consumerId === 'object' ? v.consumerId : null;
  const owner = typeof v.propertyOwnerId === 'object' ? v.propertyOwnerId : null;

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <h2>Visit — {buyer?.fullName ?? 'Unknown'}</h2>
        <Link to="/visits" className="btn btn-sm">← Back to visits</Link>
      </div>
      <p className="subtitle mono">{visitId(v)}</p>

      <div className="detail-grid">
        <div className="card">
          <div className="field-row">
            <label>Listing</label>
            <Link to={`/listings/${v.propertyId}`}>{v.propertyTitle ?? v.propertyId}</Link>
          </div>
          <div className="field-row">
            <label>Date</label>
            <span className="value">{new Date(v.date).toLocaleString()}</span>
          </div>
          <div className="field-row">
            <label>Slot</label>
            <span className="value">{v.timeSlot ?? '—'}</span>
          </div>
          <div className="field-row">
            <label>Mode</label>
            <span className="value">{v.mode === 'virtual' ? 'Virtual tour' : 'In-person'}</span>
          </div>
          <div className="field-row">
            <label>Status</label>
            {statusPill(v.status)}
          </div>
          <div className="field-row">
            <label>Notes</label>
            <span className="value" style={{ whiteSpace: 'pre-wrap' }}>{v.notes ?? '—'}</span>
          </div>

          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn btn-danger" onClick={remove} disabled={busy}>
              Delete visit
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14, color: 'var(--text-muted)' }}>Parties</h3>
          {buyer && (
            <>
              <div className="field-row">
                <label>Buyer</label>
                <Link to={`/users/${buyer._id}`}>{buyer.fullName}</Link>
              </div>
              <div className="field-row">
                <label>Buyer phone</label>
                <span className="value">{buyer.phone ?? '—'}</span>
              </div>
              <div className="field-row">
                <label>Buyer email</label>
                <span className="value mono">{buyer.email ?? '—'}</span>
              </div>
            </>
          )}
          {owner && (
            <>
              <div className="field-row">
                <label>Seller</label>
                <Link to={`/users/${owner._id}`}>{owner.fullName}</Link>
              </div>
              <div className="field-row">
                <label>Seller phone</label>
                <span className="value">{owner.phone ?? '—'}</span>
              </div>
            </>
          )}
          <div className="field-row">
            <label>Created</label>
            <span className="value">{new Date(v.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </>
  );
};
