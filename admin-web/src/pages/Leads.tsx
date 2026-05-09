import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiDelete, apiGet, errMsg } from '../api';
import { ResourceTable, Column } from '../components/ResourceTable';

interface AdminLead {
  id: string;
  sellerId: string;
  listingId: string;
  listingTitle?: string;
  consumerId?: string;
  consumerName?: string;
  consumerPhone?: string;
  consumerEmail?: string;
  message?: string;
  status: 'new' | 'contacted' | 'visit_booked' | 'closed_won' | 'closed_lost';
  visitId?: string;
  createdAt: string;
}

const statusPill = (s: AdminLead['status']) => {
  const map: Record<AdminLead['status'], string> = {
    new: 'pill-info',
    contacted: 'pill-warning',
    visit_booked: 'pill-success',
    closed_won: 'pill-success',
    closed_lost: 'pill-error',
  };
  return <span className={`pill ${map[s]}`}>{s.replace('_', ' ')}</span>;
};

export const LeadsList: React.FC = () => {
  const [status, setStatus] = useState('');
  const params = { status: status || undefined };

  const columns: Column<AdminLead>[] = [
    { header: 'Buyer', render: l => <strong>{l.consumerName ?? '—'}</strong> },
    { header: 'Phone', render: l => l.consumerPhone ?? '—' },
    { header: 'Listing', render: l => l.listingTitle ?? '—' },
    { header: 'Status', render: l => statusPill(l.status), width: '130px' },
    {
      header: 'Created',
      render: l => new Date(l.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      width: '160px',
    },
  ];

  return (
    <ResourceTable<AdminLead>
      title="Leads"
      subtitle="Every buyer engagement on a seller's listing — from inquiry to closed."
      endpoint="/admin/leads"
      columns={columns}
      params={params}
      detailPath={id => `/leads/${id}`}
      filters={
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="visit_booked">Visit booked</option>
          <option value="closed_won">Won</option>
          <option value="closed_lost">Lost</option>
        </select>
      }
    />
  );
};

export const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<AdminLead | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiGet<AdminLead>(`/admin/leads/${id}`)
      .then(setLead)
      .catch(e => setErr(errMsg(e, 'Could not load lead.')));
  }, [id]);

  if (err) return <div className="card" style={{ color: 'var(--error)' }}>{err}</div>;
  if (!lead) return <div className="card"><span className="spinner" /></div>;

  const remove = async () => {
    if (!confirm('Delete this lead?')) return;
    setBusy(true);
    try {
      await apiDelete(`/admin/leads/${lead.id}`);
      alert('Lead deleted.');
      navigate('/leads');
    } catch (e) {
      alert(errMsg(e, 'Could not delete lead.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <h2>Lead — {lead.consumerName ?? 'Unknown'}</h2>
        <Link to="/leads" className="btn btn-sm">← Back to leads</Link>
      </div>
      <p className="subtitle mono">{lead.id}</p>

      <div className="detail-grid">
        <div className="card">
          <div className="field-row">
            <label>Buyer</label>
            <span className="value">{lead.consumerName ?? '—'}</span>
          </div>
          <div className="field-row">
            <label>Email</label>
            <span className="value mono">{lead.consumerEmail ?? '—'}</span>
          </div>
          <div className="field-row">
            <label>Phone</label>
            <span className="value">{lead.consumerPhone ?? '—'}</span>
          </div>
          <div className="field-row">
            <label>Listing</label>
            {lead.listingId ? (
              <Link to={`/listings/${lead.listingId}`}>{lead.listingTitle ?? lead.listingId}</Link>
            ) : (
              <span className="value">{lead.listingTitle ?? '—'}</span>
            )}
          </div>
          <div className="field-row">
            <label>Message</label>
            <span className="value" style={{ whiteSpace: 'pre-wrap' }}>{lead.message ?? '—'}</span>
          </div>
          <div className="field-row">
            <label>Status</label>
            {statusPill(lead.status)}
          </div>

          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn btn-danger" onClick={remove} disabled={busy}>
              Delete lead
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14, color: 'var(--text-muted)' }}>Linkages</h3>
          {lead.consumerId && (
            <div className="field-row">
              <label>Buyer record</label>
              <Link to={`/users/${lead.consumerId}`} className="mono">{lead.consumerId}</Link>
            </div>
          )}
          <div className="field-row">
            <label>Seller</label>
            <Link to={`/users/${lead.sellerId}`} className="mono">{lead.sellerId}</Link>
          </div>
          {lead.visitId && (
            <div className="field-row">
              <label>Visit</label>
              <Link to={`/visits/${lead.visitId}`} className="mono">{lead.visitId}</Link>
            </div>
          )}
          <div className="field-row">
            <label>Created</label>
            <span className="value">{new Date(lead.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </>
  );
};
