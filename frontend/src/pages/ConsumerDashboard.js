import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SERVICES, SERVICE_LIST } from '../config/services';

const STATUS_LABELS = { pending: 'Yet to Confirm', confirmed: 'Confirmed', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };

const STEPS = ['pending', 'confirmed', 'in_progress', 'completed'];

function StatusStepper({ status }) {
  if (status === 'cancelled') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--danger)', fontWeight: 700 }}>✕ Cancelled</span>
      </div>
    );
  }
  const activeIdx = STEPS.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
      {STEPS.map((step, i) => {
        const done = i <= activeIdx;
        const isCurrent = i === activeIdx;
        return (
          <React.Fragment key={step}>
            {i > 0 && (
              <div style={{ flex: 1, height: 2, background: done ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: done ? 'var(--accent)' : 'var(--border)',
                boxShadow: isCurrent ? '0 0 0 3px rgba(245,158,11,0.25)' : 'none',
                transition: 'all 0.3s',
              }} />
              <span style={{
                fontSize: 9, fontWeight: isCurrent ? 700 : 500, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: done ? 'var(--accent)' : 'var(--muted)',
                whiteSpace: 'nowrap',
              }}>
                {STATUS_LABELS[step]}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ReviewModal({ booking, svc, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await onSubmit(svc, { booking: booking.id, rating, comment }); onClose(); }
    finally { setLoading(false); }
  };

  const providerField = Object.keys(booking).find((k) => k.endsWith('_name') && k !== 'consumer_name');
  const providerName = providerField ? booking[providerField] : 'Provider';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Rate {providerName}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rating</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}
                  style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', fontSize: 18, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                    background: n <= rating ? 'rgba(245,158,11,0.15)' : 'var(--surface2)',
                    borderColor: n <= rating ? 'var(--accent)' : 'var(--border)',
                    color: n <= rating ? 'var(--accent)' : 'var(--muted)',
                  }}>★</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Comment</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Share your experience…" style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>{loading ? 'Submitting…' : 'Submit Review'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ConsumerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingsBySvc, setBookingsBySvc] = useState({});
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewSvc, setReviewSvc] = useState(null);
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all(
      SERVICE_LIST.map((s) =>
        api.get(`${s.apiBase}/bookings/`).then((r) => ({ key: s.key, data: r.data })).catch(() => ({ key: s.key, data: [] }))
      )
    ).then((results) => {
      const map = {};
      results.forEach(({ key, data }) => { map[key] = Array.isArray(data) ? data : data.results || []; });
      setBookingsBySvc(map);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCancel = async (svc, id) => {
    if (!window.confirm('Cancel this booking?')) return;
    await api.patch(`${svc.apiBase}/bookings/${id}/`, { status: 'cancelled' });
    fetchAll();
  };

  const handleReviewSubmit = async (svc, data) => {
    await api.post(`${svc.apiBase}/reviews/`, data);
    setSuccess('Review submitted!');
    fetchAll();
    setTimeout(() => setSuccess(''), 3000);
  };

  const allBookings = SERVICE_LIST.flatMap((s) =>
    (bookingsBySvc[s.key] || []).map((b) => ({ ...b, _svc: s }))
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const displayedBookings = activeTab === 'all'
    ? (statusFilter === 'all' ? allBookings : allBookings.filter((b) => b.status === statusFilter))
    : (bookingsBySvc[activeTab] || []).map((b) => ({ ...b, _svc: SERVICES[activeTab] }));

  if (loading) return <div className="spinner">Loading bookings…</div>;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      {reviewTarget && reviewSvc && (
        <ReviewModal booking={reviewTarget} svc={reviewSvc} onClose={() => { setReviewTarget(null); setReviewSvc(null); }} onSubmit={handleReviewSubmit} />
      )}

      <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>{user?.first_name || user?.username}'s account</p>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>My Bookings</h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}>{allBookings.length} total bookings across all services</p>

      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--success)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 14 }}>{success}</div>}

      {/* Service Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <button className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('all')}>All Services</button>
        {SERVICE_LIST.filter((s) => (bookingsBySvc[s.key] || []).length > 0).map((s) => (
          <button key={s.key} className={`btn btn-sm ${activeTab === s.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab(s.key)}>
            {s.icon} {s.label} ({(bookingsBySvc[s.key] || []).length})
          </button>
        ))}
      </div>

      {/* Status filter (only when all tab active) */}
      {activeTab === 'all' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((s) => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textTransform: 'capitalize' }} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All Status' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}

      {displayedBookings.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <p style={{ marginBottom: 16 }}>No bookings yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Find a Professional</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayedBookings.map((b) => {
            const svc = b._svc;
            const providerField = Object.keys(b).find((k) => k.endsWith('_name') && k !== 'consumer_name');
            const providerName = providerField ? b[providerField] : '—';
            return (
              <div key={`${svc.key}-${b.id}`} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ fontSize: 24, lineHeight: 1 }}>{svc.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{svc.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>with {providerName} · {b.city}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                        {new Date(b.scheduled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 16 }}>₹{Number(b.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>

                {b.notes && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>Note: {b.notes}</div>}

                <StatusStepper status={b.status} />

                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {b.status === 'pending' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(svc, b.id)}>Cancel</button>
                  )}
                  {b.status === 'completed' && !b.has_review && (
                    <button className="btn btn-primary btn-sm" onClick={() => { setReviewTarget(b); setReviewSvc(svc); }}>Leave Review</button>
                  )}
                  {b.status === 'completed' && b.has_review && (
                    <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>✓ Reviewed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
