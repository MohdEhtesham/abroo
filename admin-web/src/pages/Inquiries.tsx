import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiDelete, apiGet, errMsg } from '../api';
import { ResourceTable, Column } from '../components/ResourceTable';

interface AdminInquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  message?: string;
  propertyId: string;
  propertyTitle?: string;
  propertyLocation?: string;
  consumerId?: string;
  propertyOwnerId?: string;
  status: 'new' | 'in_review' | 'closed';
  events?: { id: string; status: string; title: string; description?: string; timestamp: string }[];
  createdAt: string;
}

const statusPill = (s: string) => {
  const cls =
    s === 'closed'
      ? 'pill-muted'
      : s === 'in_review'
      ? 'pill-warning'
      : 'pill-info';
  return <span className={`pill ${cls}`}>{s.replace('_', ' ')}</span>;
};

export const InquiriesList: React.FC = () => {
  const [status, setStatus] = useState('');
  const params = { status: status || undefined };

  const columns: Column<AdminInquiry>[] = [
    { header: 'Name', render: i => <strong>{i.fullName}</strong> },
    { header: 'Email', render: i => <span className="mono">{i.email}</span> },
    { header: 'Phone', render: i => i.phone },
    { header: 'Listing', render: i => i.propertyTitle ?? '—' },
    { header: 'Status', render: i => statusPill(i.status), width: '120px' },
    {
      header: 'Submitted',
      render: i => new Date(i.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      width: '160px',
    },
  ];

  return (
    <ResourceTable<AdminInquiry>
      title="Inquiries"
      subtitle="Every property inquiry submitted by buyers."
      endpoint="/admin/inquiries"
      columns={columns}
      params={params}
      detailPath={id => `/inquiries/${id}`}
      filters={
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="new">New</option>
          <option value="in_review">In review</option>
          <option value="closed">Closed</option>
        </select>
      }
    />
  );
};

export const InquiryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inq, setInq] = useState<AdminInquiry | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiGet<AdminInquiry>(`/admin/inquiries/${id}`)
      .then(setInq)
      .catch(e => setErr(errMsg(e, 'Could not load inquiry.')));
  }, [id]);

  if (err) return <div className="card" style={{ color: 'var(--error)' }}>{err}</div>;
  if (!inq) return <div className="card"><span className="spinner" /></div>;

  const remove = async () => {
    if (!confirm('Delete this inquiry?')) return;
    setBusy(true);
    try {
      await apiDelete(`/admin/inquiries/${inq.id}`);
      alert('Inquiry deleted.');
      navigate('/inquiries');
    } catch (e) {
      alert(errMsg(e, 'Could not delete inquiry.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <h2>Inquiry — {inq.fullName}</h2>
        <Link to="/inquiries" className="btn btn-sm">← Back to inquiries</Link>
      </div>
      <p className="subtitle mono">{inq.id}</p>

      <div className="detail-grid">
        <div className="card">
          <div className="field-row">
            <label>Name</label>
            <span className="value">{inq.fullName}</span>
          </div>
          <div className="field-row">
            <label>Email</label>
            <span className="value mono">{inq.email}</span>
          </div>
          <div className="field-row">
            <label>Phone</label>
            <span className="value">{inq.phone}</span>
          </div>
          <div className="field-row">
            <label>Listing</label>
            <Link to={`/listings/${inq.propertyId}`}>{inq.propertyTitle ?? inq.propertyId}</Link>
          </div>
          <div className="field-row">
            <label>Message</label>
            <span className="value" style={{ whiteSpace: 'pre-wrap' }}>{inq.message ?? '—'}</span>
          </div>
          <div className="field-row">
            <label>Status</label>
            {statusPill(inq.status)}
          </div>

          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn btn-danger" onClick={remove} disabled={busy}>
              Delete inquiry
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14, color: 'var(--text-muted)' }}>Timeline</h3>
          {(inq.events ?? []).length === 0 && <span className="muted">No timeline events.</span>}
          {(inq.events ?? []).map(ev => (
            <div key={ev.id} className="field-row">
              <label>{new Date(ev.timestamp).toLocaleString()}</label>
              <span className="value">
                <strong>{ev.title}</strong>
                {ev.description ? <span className="muted"> · {ev.description}</span> : null}
              </span>
            </div>
          ))}
          <div className="field-row">
            <label>Submitted</label>
            <span className="value">{new Date(inq.createdAt).toLocaleString()}</span>
          </div>
          {inq.consumerId && (
            <div className="field-row">
              <label>Buyer record</label>
              <Link to={`/users/${inq.consumerId}`} className="mono">{inq.consumerId}</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
