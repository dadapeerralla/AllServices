import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SERVICES } from '../config/services';

const STATUS_LABELS = { pending: 'Pending', confirmed: 'Confirmed', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
const NEXT_STATUS = {
  pending:     { label: 'Confirm Job', value: 'confirmed' },
  confirmed:   { label: 'Start Job',   value: 'in_progress' },
  in_progress: { label: 'Mark Complete', value: 'completed' },
};

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAvailable, setIsAvailable] = useState(true);
  const [toggling, setToggling] = useState(false);

  const svcKey = user?.service_type ? user.service_type + 's' : null;
  const svc = svcKey ? SERVICES[svcKey] : null;

  const fetchBookings = useCallback(() => {
    if (!svc) return;
    api.get(`${svc.apiBase}/bookings/`)
      .then((r) => setBookings(Array.isArray(r.data) ? r.data : r.data.results || []))
      .finally(() => setLoading(false));
  }, [svc]);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/provider-profile/');
      setIsAvailable(res.data.is_available);
    } catch {}
  }, []);

  useEffect(() => { fetchBookings(); fetchAvailability(); }, [fetchBookings, fetchAvailability]);

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await api.patch('/api/auth/provider-profile/', { is_available: !isAvailable });
      setIsAvailable(res.data.is_available);
    } catch {}
    setToggling(false);
  };

  const updateStatus = async (id, newStatus) => {
    await api.patch(`${svc.apiBase}/bookings/${id}/`, { status: newStatus });
    fetchBookings();
  };

  if (!svc) return <div className="container spinner">Could not determine your service type.</div>;
  if (loading) return <div className="spinner">Loading jobs…</div>;

  const filtered = statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);
  const earnings = bookings.filter((b) => b.status === 'completed').reduce((s, b) => s + Number(b.total_amount || 0), 0);
  const activeCount = bookings.filter((b) => ['pending', 'confirmed', 'in_progress'].includes(b.status)).length;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>Provider Dashboard</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <span style={{ fontSize: 32 }}>{svc.icon}</span>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>My Jobs — {svc.label}</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>{user?.first_name || user?.username}</p>
        </div>
        <button
          onClick={toggleAvailability}
          disabled={toggling}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 100, border: 'none',
            cursor: toggling ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 13,
            background: isAvailable ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: isAvailable ? 'var(--success)' : 'var(--danger)',
            transition: 'all 0.2s',
          }}
        >
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isAvailable ? 'var(--success)' : 'var(--danger)',
          }} />
          {isAvailable ? 'Active' : 'Inactive'}
        </button>
      </div>

      {!isAvailable && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
          <span style={{ fontSize: 18 }}>⏸</span>
          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>You are currently inactive.</span>
          <span style={{ color: 'var(--muted)' }}>Customers cannot see your profile. Click <strong>Active</strong> above to go live.</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          ['Total Earned', `₹${earnings.toFixed(0)}`, 'var(--accent)'],
          ['Active Jobs', activeCount, '#3B82F6'],
          ['Total Jobs', bookings.length, 'var(--text)'],
          ['Completed', bookings.filter((b) => b.status === 'completed').length, 'var(--success)'],
        ].map(([label, value, color]) => (
          <div key={label} className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: '-1px' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((s) => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            style={{ textTransform: 'capitalize' }} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p>{statusFilter === 'all' ? 'No jobs yet. Make sure your profile is set to Available.' : `No ${STATUS_LABELS[statusFilter]} jobs.`}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((b) => {
            const next = NEXT_STATUS[b.status];
            return (
              <div key={b.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Customer: {b.consumer_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {new Date(b.scheduled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>📍 {b.address}, {b.city}</div>
                    {/* Service-specific fields */}
                    {Object.entries(b).filter(([k]) => !['id','consumer','consumer_name','address','city','scheduled_at','status','notes','total_amount','created_at','updated_at','has_review'].includes(k) && !k.endsWith('_name') && !['consumer_detail'].includes(k) && b[k]).slice(0, 3).map(([k, v]) => (
                      <div key={k} style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        <span style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}: </span><span style={{ fontWeight: 600, color: 'var(--text)' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span className={`badge badge-${b.status}`}>{STATUS_LABELS[b.status]}</span>
                    <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 16 }}>₹{Number(b.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>

                {b.notes && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>Note: {b.notes}</div>}

                {next && (
                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => updateStatus(b.id, next.value)}>{next.label} →</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
