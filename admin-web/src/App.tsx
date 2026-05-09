import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { apiGet, apiPost, getToken, setToken } from './api';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersList, UserDetail } from './pages/Users';
import { ListingsList, ListingDetail } from './pages/Listings';
import { LeadsList, LeadDetail } from './pages/Leads';
import { VisitsList, VisitDetail } from './pages/Visits';
import { InquiriesList, InquiryDetail } from './pages/Inquiries';

interface Me {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'consumer' | 'seller';
}

const NAV_ITEMS: { path: string; label: string }[] = [
  { path: '/', label: '📊 Dashboard' },
  { path: '/users', label: '👥 Users' },
  { path: '/listings', label: '🏠 Listings' },
  { path: '/leads', label: '🤝 Leads' },
  { path: '/visits', label: '📅 Visits' },
  { path: '/inquiries', label: '💬 Inquiries' },
];

export const App: React.FC = () => {
  const [me, setMe] = useState<Me | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setBootstrapped(true);
      return;
    }
    // Lightweight auth probe: dashboard endpoint is admin-only and cheap.
    // If it succeeds we know the token belongs to an admin; if not we
    // wipe it. We don't have a /me endpoint specifically for admins yet.
    apiGet<{ users: { total: number } }>('/admin/dashboard')
      .then(() => {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setMe({
            id: payload.sub,
            fullName: 'Admin',
            email: '',
            role: payload.role ?? 'admin',
          });
        } catch {
          setMe({ id: '', fullName: 'Admin', email: '', role: 'admin' });
        }
      })
      .catch(() => setToken(null))
      .finally(() => setBootstrapped(true));
  }, []);

  if (!bootstrapped) {
    return (
      <div className="login-shell">
        <span className="spinner" />
      </div>
    );
  }

  if (!me) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLoggedIn={setMe} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Shell me={me} onLogout={() => setMe(null)}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<UsersList />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/listings" element={<ListingsList />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/leads" element={<LeadsList />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/visits" element={<VisitsList />} />
        <Route path="/visits/:id" element={<VisitDetail />} />
        <Route path="/inquiries" element={<InquiriesList />} />
        <Route path="/inquiries/:id" element={<InquiryDetail />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
};

interface ShellProps {
  me: Me;
  onLogout: () => void;
  children: React.ReactNode;
}

const Shell: React.FC<ShellProps> = ({ me, onLogout, children }) => {
  const navigate = useNavigate();
  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>
          <span className="dot" />
          Aabroo Admin
        </h1>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {item.label}
          </NavLink>
        ))}
        <div className="spacer" />
        <div className="who">
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{me.fullName}</div>
          <div className="mono">role: {me.role}</div>
          <button
            onClick={async () => {
              try { await apiPost('/auth/logout'); } catch {}
              setToken(null);
              onLogout();
              navigate('/login', { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
};
