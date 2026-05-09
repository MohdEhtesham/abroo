import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiDelete, apiGet, apiPut, errMsg } from '../api';
import { ResourceTable, Column } from '../components/ResourceTable';

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  role: 'consumer' | 'seller' | 'admin';
  suspended?: boolean;
  avatar?: string;
  createdAt: string;
  seller?: { plan?: string; listingQuotaUsed?: number; listingQuotaTotal?: number };
}

const rolePill = (r: AdminUser['role']) => {
  if (r === 'admin') return <span className="pill pill-warning">admin</span>;
  if (r === 'seller') return <span className="pill pill-info">seller</span>;
  return <span className="pill pill-muted">buyer</span>;
};

export const UsersList: React.FC = () => {
  const [role, setRole] = useState<string>('');
  const [suspended, setSuspended] = useState<string>('');
  const params = {
    role: role || undefined,
    suspended: suspended || undefined,
  };

  const columns: Column<AdminUser>[] = [
    { header: 'Name', render: u => <strong>{u.fullName}</strong> },
    { header: 'Email', render: u => <span className="mono">{u.email}</span> },
    { header: 'Phone', render: u => u.phone },
    { header: 'City', render: u => u.city ?? <span className="muted">—</span> },
    { header: 'Role', render: u => rolePill(u.role), width: '90px' },
    {
      header: 'Status',
      render: u =>
        u.suspended ? (
          <span className="pill pill-error">suspended</span>
        ) : (
          <span className="pill pill-success">active</span>
        ),
      width: '110px',
    },
    {
      header: 'Joined',
      render: u => new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      width: '120px',
    },
  ];

  return (
    <ResourceTable<AdminUser>
      title="Users"
      subtitle="Everyone who has signed up — buyers, sellers, and admins."
      endpoint="/admin/users"
      columns={columns}
      params={params}
      detailPath={id => `/users/${id}`}
      filters={
        <>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="consumer">Buyers</option>
            <option value="seller">Sellers</option>
            <option value="admin">Admins</option>
          </select>
          <select value={suspended} onChange={e => setSuspended(e.target.value)}>
            <option value="">Any status</option>
            <option value="false">Active</option>
            <option value="true">Suspended</option>
          </select>
        </>
      }
    />
  );
};

export const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Partial<AdminUser>>({});

  useEffect(() => {
    if (!id) return;
    apiGet<AdminUser>(`/admin/users/${id}`)
      .then(u => {
        setUser(u);
        setForm({
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          city: u.city,
          role: u.role,
          suspended: u.suspended,
        });
      })
      .catch(e => setErr(errMsg(e, 'Could not load user.')));
  }, [id]);

  if (err) return <div className="card" style={{ color: 'var(--error)' }}>{err}</div>;
  if (!user) return <div className="card"><span className="spinner" /></div>;

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await apiPut<AdminUser>(`/admin/users/${user.id}`, form);
      setUser(updated);
      alert('User updated.');
    } catch (e) {
      alert(errMsg(e, 'Could not save changes.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete ${user.fullName}? This cascades to their listings, leads, visits, inquiries, chats and notifications.`))
      return;
    setBusy(true);
    try {
      await apiDelete(`/admin/users/${user.id}`);
      alert('User deleted.');
      navigate('/users');
    } catch (e) {
      alert(errMsg(e, 'Could not delete user.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <h2>{user.fullName}</h2>
        <Link to="/users" className="btn btn-sm">← Back to users</Link>
      </div>
      <p className="subtitle mono">{user.id}</p>

      <div className="detail-grid">
        <div className="card">
          <div className="field-row">
            <label>Full name</label>
            <input value={form.fullName ?? ''} onChange={e => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="field-row">
            <label>Email</label>
            <input value={form.email ?? ''} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field-row">
            <label>Phone</label>
            <input value={form.phone ?? ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field-row">
            <label>City</label>
            <input value={form.city ?? ''} onChange={e => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="field-row">
            <label>Role</label>
            <select value={form.role ?? user.role} onChange={e => setForm({ ...form, role: e.target.value as any })}>
              <option value="consumer">Buyer (consumer)</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="field-row">
            <label>Account status</label>
            <select
              value={form.suspended ? 'true' : 'false'}
              onChange={e => setForm({ ...form, suspended: e.target.value === 'true' })}
            >
              <option value="false">Active</option>
              <option value="true">Suspended (cannot use the app)</option>
            </select>
          </div>
          <div className="row" style={{ marginTop: 16, gap: 10 }}>
            <button className="btn btn-primary" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <button className="btn btn-danger" onClick={remove} disabled={busy}>
              Delete user
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14, color: 'var(--text-muted)' }}>Account snapshot</h3>
          <div className="field-row">
            <label>Joined</label>
            <span className="value">{new Date(user.createdAt).toLocaleString()}</span>
          </div>
          {user.role === 'seller' && user.seller && (
            <>
              <div className="field-row">
                <label>Plan</label>
                <span className="value">{user.seller.plan ?? 'free'}</span>
              </div>
              <div className="field-row">
                <label>Listing quota</label>
                <span className="value">
                  {user.seller.listingQuotaUsed ?? 0} / {user.seller.listingQuotaTotal ?? 1}
                </span>
              </div>
            </>
          )}
          <div className="field-row">
            <label>User id</label>
            <span className="value mono">{user.id}</span>
          </div>
        </div>
      </div>
    </>
  );
};
