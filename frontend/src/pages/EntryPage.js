import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVICE_LIST, SERVICES } from '../config/services';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const STATUS_LABELS = { pending: 'Yet to Confirm', confirmed: 'Confirmed', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };

export default function EntryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedStat, setSelectedStat] = useState(null);

  const isProvider = user?.user_type === 'provider';

  const fetchStats = useCallback(async () => {
    if (!isProvider) return;
    const svcKey = user.service_type ? user.service_type + 's' : null;
    const svc = svcKey ? SERVICES[svcKey] : null;
    if (!svc) return;
    try {
      const res = await api.get(`${svc.apiBase}/bookings/`);
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setBookings(data);
      setStats({
        total: data.length,
        active: data.filter((b) => ['pending', 'confirmed', 'in_progress'].includes(b.status)).length,
        completed: data.filter((b) => b.status === 'completed').length,
        earned: data.filter((b) => b.status === 'completed').reduce((s, b) => s + Number(b.total_amount || 0), 0),
        svc,
      });
    } catch {}
  }, [isProvider, user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const getFilteredBookings = () => {
    if (!selectedStat) return [];
    if (selectedStat === 'total') return bookings;
    if (selectedStat === 'active') return bookings.filter((b) => ['pending', 'confirmed', 'in_progress'].includes(b.status));
    if (selectedStat === 'completed') return bookings.filter((b) => b.status === 'completed');
    if (selectedStat === 'earned') return bookings.filter((b) => b.status === 'completed');
    return [];
  };

  const handleStatClick = (key) => {
    setSelectedStat(selectedStat === key ? null : key);
  };

  const filtered = getFilteredBookings();

  return (
    <>
      {/* Ticker - hidden for providers */}
      {!isProvider && (
        <div style={{ background: 'var(--accent)', padding: '9px 0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'ticker 30s linear infinite', gap: 0 }}>
            {[...SERVICE_LIST, ...SERVICE_LIST].map((s, i) => (
              <span key={i} onClick={() => navigate(`/service/${s.key}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '0 28px', fontWeight: 800, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#0D0D0F', cursor: 'pointer' }}>
                {s.icon} {s.label}
                <span style={{ width: 3, height: 3, background: 'rgba(13,13,15,0.3)', borderRadius: '50%', display: 'inline-block' }} />
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .entry-card { transition: all 0.2s ease; }
        .entry-card:hover { transform: translateY(-6px); border-color: var(--accent) !important; box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
      `}</style>

      {/* Hero */}
      <div className="container" style={{ paddingTop: 80, paddingBottom: 48, textAlign: 'center' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20, fontWeight: 600 }}>
          Pan-India On-Demand Platform
        </p>
        <h1 style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', fontWeight: 800, lineHeight: 1, letterSpacing: '-2px', marginBottom: 24 }}>
          Every Pro<br /><span style={{ color: 'var(--accent)' }}>At Your Door.</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 520, lineHeight: 1.7, margin: '0 auto 56px' }}>
          Verified drivers, barbers, carpenters, electricians, lawyers, and labourers — one platform, instant booking, right at your doorstep.
        </p>

        {/* Show choice cards only for logged-out users */}
        {!user && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 720, margin: '0 auto' }}>
            {/* Customer Card */}
            <div className="card entry-card" style={{ padding: 40, textAlign: 'center', cursor: 'pointer', border: '2px solid var(--border)' }}
              onClick={() => navigate('/register', { state: { userType: 'consumer' } })}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>👤</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>I'm a Customer</h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 28 }}>
                Find and book verified professionals for drivers, barbers, carpenters, electricians, lawyers, and labourers.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-primary" style={{ padding: '11px 24px', fontSize: 14, fontWeight: 700 }}
                  onClick={(e) => { e.stopPropagation(); navigate('/login', { state: { userType: 'consumer' } }); }}>
                  Sign In
                </button>
                <button className="btn btn-ghost" style={{ padding: '11px 24px', fontSize: 14, fontWeight: 700 }}
                  onClick={(e) => { e.stopPropagation(); navigate('/register', { state: { userType: 'consumer' } }); }}>
                  Register
                </button>
              </div>
            </div>

            {/* Provider Card */}
            <div className="card entry-card" style={{ padding: 40, textAlign: 'center', cursor: 'pointer', border: '2px solid var(--border)' }}
              onClick={() => navigate('/register', { state: { userType: 'provider' } })}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🧰</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>I'm a Service Provider</h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 28 }}>
                Join as a verified professional, manage your bookings, set your rates, and grow your business.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-primary" style={{ padding: '11px 24px', fontSize: 14, fontWeight: 700 }}
                  onClick={(e) => { e.stopPropagation(); navigate('/login', { state: { userType: 'provider' } }); }}>
                  Sign In
                </button>
                <button className="btn btn-ghost" style={{ padding: '11px 24px', fontSize: 14, fontWeight: 700 }}
                  onClick={(e) => { e.stopPropagation(); navigate('/register', { state: { userType: 'provider' } }); }}>
                  Register
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show greeting for logged-in users */}
        {user && !isProvider && (
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                Welcome back, {user.first_name || user.username} 👋
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>
                Browse services below to find and book the right professional.
              </p>
              <button className="btn btn-primary" onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })} style={{ padding: '11px 28px', fontSize: 14, fontWeight: 700 }}>
                Browse Services ↓
              </button>
            </div>
          </div>
        )}

        {user && isProvider && stats && (
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <div className="card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <span style={{ fontSize: 36 }}>{stats.svc.icon}</span>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800 }}>Welcome back, {user.first_name || user.username} 👋</h2>
                  <p style={{ fontSize: 14, color: 'var(--muted)' }}>Here's an overview of your {stats.svc.label} work.</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/jobs')} style={{ padding: '11px 24px', fontSize: 14, fontWeight: 700 }}>
                  My Jobs →
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  ['total', 'Total Jobs', stats.total, 'var(--text)'],
                  ['active', 'Active Jobs', stats.active, '#3B82F6'],
                  ['completed', 'Completed', stats.completed, 'var(--success)'],
                  ['earned', 'Total Earned', `₹${stats.earned.toFixed(0)}`, 'var(--accent)'],
                ].map(([key, label, value, color]) => (
                  <div key={key}
                    onClick={() => handleStatClick(key)}
                    style={{
                      background: selectedStat === key ? `${color}15` : 'var(--surface)',
                      borderRadius: 'var(--radius-sm)', padding: 16, textAlign: 'center',
                      border: `1px solid ${selectedStat === key ? color : 'var(--border)'}`,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>{label}</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: '-1px' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtered Bookings */}
            {selectedStat && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>
                    {selectedStat === 'total' && 'All Jobs'}
                    {selectedStat === 'active' && 'Active Jobs'}
                    {selectedStat === 'completed' && 'Completed Jobs'}
                    {selectedStat === 'earned' && 'Completed (Earning) Jobs'}
                    <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>({filtered.length})</span>
                  </p>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedStat(null)}>✕ Close</button>
                </div>
                {filtered.length === 0 ? (
                  <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>No jobs found.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.map((b) => (
                      <div key={b.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>Customer: {b.consumer_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                            {new Date(b.scheduled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {b.city ? ` · ${b.city}` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>₹{Number(b.total_amount || 0).toFixed(0)}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 100,
                            color: b.status === 'completed' ? 'var(--success)' : b.status === 'cancelled' ? 'var(--danger)' : 'var(--muted)',
                            background: b.status === 'completed' ? 'rgba(16,185,129,0.1)' : b.status === 'cancelled' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                          }}>
                            {STATUS_LABELS[b.status] || b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats - only for logged-out or customers */}
      {!isProvider && (
        <>
          <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '32px 24px' }}>
              {[['6', 'Service Categories'], ['100%', 'Verified Providers'], ['24/7', 'Support Available']].map(([v, l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--accent)' }}>{v}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          <div className="container" style={{ paddingTop: 64, paddingBottom: 80 }} id="services">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600 }}>Services</span>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Choose a Category</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {SERVICE_LIST.map((svc) => (
                <div
                  key={svc.key}
                  className="svc-card"
                  onClick={() => navigate(`/service/${svc.key}`)}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 32 }}>{svc.icon}</span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: svc.color }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{svc.label}</h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{svc.description}</p>
                  </div>
                  <div style={{ marginTop: 'auto', fontSize: 13, color: svc.color, fontWeight: 600 }}>
                    Browse {svc.label} →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
