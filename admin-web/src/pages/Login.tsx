import { useState } from 'react';
import { apiPost, errMsg, setToken } from '../api';

interface LoginRes {
  user: { id: string; fullName: string; email: string; role: 'admin' | 'consumer' | 'seller' };
  token: string;
}

interface Me {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'consumer' | 'seller';
}

export const Login: React.FC<{ onLoggedIn: (me: Me) => void }> = ({ onLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      // Reuse the regular auth endpoint. The backend doesn't gate it by
      // role, but we reject any token that isn't an admin's so a regular
      // buyer/seller can't get past this screen.
      const res = await apiPost<LoginRes>('/auth/login', { identifier: email, password });
      if (res.user.role !== 'admin') {
        throw new Error('This account is not an admin. Sign in with an admin account.');
      }
      setToken(res.token);
      onLoggedIn(res.user);
    } catch (e) {
      setErr(errMsg(e, 'Could not sign in.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <h1>Aabroo Admin</h1>
        <p className="muted">Sign in with your admin credentials.</p>

        {err && <div className="err">{err}</div>}

        <label>Email</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};
