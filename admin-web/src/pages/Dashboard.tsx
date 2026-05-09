import { useEffect, useState } from 'react';
import { apiGet, errMsg } from '../api';

interface DashboardData {
  users: { total: number; consumers: number; sellers: number; suspended: number; new30d: number };
  listings: { total: number; live: number; new30d: number };
  leads: { total: number; new24h: number };
  visits: { total: number; upcoming: number };
  inquiries: { total: number; new24h: number };
  chats: { total: number };
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiGet<DashboardData>('/admin/dashboard')
      .then(setData)
      .catch(e => setErr(errMsg(e, 'Could not load dashboard')));
  }, []);

  if (err) {
    return (
      <>
        <h2>Dashboard</h2>
        <div className="card" style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'var(--error)', color: 'var(--error)' }}>
          {err}
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <h2>Dashboard</h2>
        <p className="subtitle">Live system metrics across users, listings, leads, visits and inquiries.</p>
        <div className="kpi-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="kpi" style={{ minHeight: 110 }}>
              <span className="spinner" />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <h2>Dashboard</h2>
      <p className="subtitle">Live system metrics across users, listings, leads, visits and inquiries.</p>

      <div className="kpi-grid">
        <Kpi
          icon="👥"
          label="Total users"
          value={data.users.total}
          delta={`+${data.users.new30d} in 30d · ${data.users.consumers} buyer / ${data.users.sellers} seller`}
        />
        <Kpi
          icon="🚫"
          label="Suspended"
          value={data.users.suspended}
          delta={data.users.suspended > 0 ? 'Review on Users tab' : 'All clear'}
        />
        <Kpi
          icon="🏠"
          label="Listings"
          value={data.listings.total}
          delta={`${data.listings.live} live · +${data.listings.new30d} in 30d`}
        />
        <Kpi
          icon="🤝"
          label="Leads"
          value={data.leads.total}
          delta={`+${data.leads.new24h} in last 24h`}
          deltaUp={data.leads.new24h > 0}
        />
        <Kpi
          icon="📅"
          label="Visits"
          value={data.visits.total}
          delta={`${data.visits.upcoming} upcoming`}
        />
        <Kpi
          icon="💬"
          label="Inquiries"
          value={data.inquiries.total}
          delta={`+${data.inquiries.new24h} in last 24h`}
          deltaUp={data.inquiries.new24h > 0}
        />
      </div>
    </>
  );
};

interface KpiProps {
  icon: string;
  label: string;
  value: number;
  delta?: string;
  deltaUp?: boolean;
}

const Kpi: React.FC<KpiProps> = ({ icon, label, value, delta, deltaUp }) => (
  <div className="kpi">
    <div className="icon">{icon}</div>
    <div className="label">{label}</div>
    <div className="value">{value.toLocaleString('en-IN')}</div>
    {delta && <div className={`delta ${deltaUp ? 'up' : ''}`}>{delta}</div>}
  </div>
);
