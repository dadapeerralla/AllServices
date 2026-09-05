import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SERVICE_LIST } from '../config/services';

const TABS = [
  {
    key: 'consumer',
    label: 'Customer',
    icon: '👤',
    heading: 'Welcome back',
    sub: 'Sign in to book services across all categories.',
    placeholder: 'your_username',
    demo: { label: 'Demo customer', cred: 'testconsumer / password123' },
  },
  {
    key: 'provider',
    label: 'Service Provider',
    icon: '🧰',
    heading: 'Provider portal',
    sub: 'Sign in to manage your jobs and availability.',
    placeholder: 'your_username',
    demo: { label: 'Demo driver', cred: 'rajan_driver / password123' },
  },
];

export default function Login() {
  const location = useLocation();
  const initialTab = location.state?.userType || 'consumer';
  const [tab, setTab] = useState(initialTab);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = location.state?.from || '/';

  const active = TABS.find((t) => t.key === tab);

  const handleTab = (key) => {
    setTab(key);
    setForm({ username: '', password: '' });
    setError('');
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      if (user.user_type === 'provider') {
        navigate('/jobs', { replace: true });
      } else {
        navigate(from !== '/login' ? from : '/', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '64px 24px 80px', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 36, gap: 4 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTab(t.key)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 'calc(var(--radius) - 4px)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: tab === t.key ? 'var(--accent)' : 'transparent',
                color: tab === t.key ? '#0D0D0F' : 'var(--muted)',
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>
            {active.heading}
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>Sign In</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>{active.sub}</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder={active.placeholder}
              required
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              marginTop: 8,
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: 'var(--accent)',
              color: '#0D0D0F',
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in…' : `Sign In as ${active.label}`}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" state={{ userType: tab }} style={{ color: 'var(--accent)', fontWeight: 600 }}>Register</Link>
        </p>

        {/* Demo credentials */}
        <div style={{ marginTop: 28, padding: '16px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12, fontWeight: 600 }}>
            Demo Credentials
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{active.demo.label}</span>
              <code style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(245,158,11,0.08)', padding: '3px 8px', borderRadius: 4 }}>
                {active.demo.cred}
              </code>
            </div>
            {tab === 'provider' && (
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                Other providers: vijay_driver, mohit_barber, suresh_carpenter, anil_electrician, adv_priya, santosh_labour — all use <code style={{ color: 'var(--accent)' }}>password123</code>
              </p>
            )}
          </div>
        </div>

        {/* Provider service icons hint */}
        {tab === 'provider' && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {SERVICE_LIST.map((s) => (
              <span key={s.key} style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {s.icon} {s.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
