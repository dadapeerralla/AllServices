import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SERVICE_LIST, SERVICES } from '../config/services';

const STATUS_LABELS = { pending: 'Yet to Confirm', confirmed: 'Confirmed', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };

export default function Profile() {
  const { user, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({});
  const [providerProfile, setProviderProfile] = useState(null);
  const [providerForm, setProviderForm] = useState({});
  const [editingRate, setEditingRate] = useState(false);
  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [toggling, setToggling] = useState(false);

  const isProvider = user?.user_type === 'provider';

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
      });
    }
  }, [user]);

  const fetchProviderProfile = useCallback(async () => {
    if (!isProvider) return;
    try {
      const res = await api.get('/api/auth/provider-profile/');
      setProviderProfile(res.data);
      setIsAvailable(res.data.is_available);
      setProviderForm({
        hourly_rate: res.data.hourly_rate || '0',
        bio: res.data.bio || '',
        years_experience: res.data.years_experience || 0,
      });
    } catch {}
  }, [isProvider]);

  const fetchActivity = useCallback(async () => {
    if (!user) return;
    setLoadingActivity(true);
    try {
      if (isProvider) {
        const svcKey = user.service_type ? user.service_type + 's' : null;
        const svc = svcKey ? SERVICES[svcKey] : null;
        if (svc) {
          const res = await api.get(`${svc.apiBase}/bookings/`);
          const bookings = Array.isArray(res.data) ? res.data : res.data.results || [];
          setActivity(bookings.map((b) => ({ ...b, _type: 'booking', _svc: svc })));
        }
      } else {
        const results = await Promise.all(
          SERVICE_LIST.map((s) =>
            api.get(`${s.apiBase}/bookings/`).then((r) => ({ key: s.key, data: Array.isArray(r.data) ? r.data : r.data.results || [], svc: s })).catch(() => ({ key: s.key, data: [], svc: s }))
          )
        );
        const all = results.flatMap(({ data, svc }) => data.map((b) => ({ ...b, _type: 'booking', _svc: svc })));
        setActivity(all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    } catch {}
    setLoadingActivity(false);
  }, [user, isProvider]);

  useEffect(() => { fetchProviderProfile(); fetchActivity(); }, [fetchProviderProfile, fetchActivity]);

  const handleSaveUser = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/api/auth/profile/', form);
      await fetchProfile();
      setEditing(false);
      setSuccess('Profile updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProvider = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/api/auth/provider-profile/', {
        hourly_rate: providerForm.hourly_rate,
        bio: providerForm.bio,
        years_experience: providerForm.years_experience,
      });
      setProviderProfile((p) => ({ ...p, ...providerForm }));
      setEditingRate(false);
      setSuccess('Charges & profile updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update provider profile.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await api.patch('/api/auth/provider-profile/', { is_available: !isAvailable });
      setIsAvailable(res.data.is_available);
      setSuccess(isAvailable ? 'You are now offline. Customers cannot see you.' : 'You are now active! Customers can find you.');
      setTimeout(() => setSuccess(''), 3000);
    } catch {}
    setToggling(false);
  };

  if (!user) return <div className="spinner">Loading profile...</div>;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 720 }}>
      <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>My Profile</p>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 32 }}>{isProvider ? 'Provider Profile' : 'Customer Profile'}</h1>

      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--success)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 14 }}>{success}</div>}
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 14 }}>{error}</div>}

      {/* Account Info */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>Account Details</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Username: <strong style={{ color: 'var(--text)' }}>{user.username}</strong> · {isProvider ? 'Provider' : 'Customer'}</p>
          </div>
          {!editing && (
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
          )}
        </div>

        {editing ? (
          <>
            <div className="form-row">
              <div className="form-group"><label>First Name</label><input name="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
              <div className="form-group"><label>Last Name</label><input name="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Email</label><input type="email" name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label>Phone</label><input name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="form-group"><label>City</label><input name="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setForm({ first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '', phone: user.phone || '', city: user.city || '' }); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveUser} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            {[
              ['First Name', user.first_name || '—'],
              ['Last Name', user.last_name || '—'],
              ['Email', user.email || '—'],
              ['Phone', user.phone || '—'],
              ['City', user.city || '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Provider Charges */}
      {isProvider && providerProfile && (
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>Charges & Rate</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Set your hourly rate and professional details</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={toggleAvailability}
                disabled={toggling}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px', borderRadius: 100, border: 'none',
                  cursor: toggling ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: 12,
                  background: isAvailable ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: isAvailable ? 'var(--success)' : 'var(--danger)',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: isAvailable ? 'var(--success)' : 'var(--danger)' }} />
                {isAvailable ? 'Active' : 'Inactive'}
              </button>
              {!editingRate && (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingRate(true)}>Edit</button>
              )}
            </div>
          </div>

          {editingRate ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Hourly Rate (₹)</label>
                  <input type="number" value={providerForm.hourly_rate} onChange={(e) => setProviderForm({ ...providerForm, hourly_rate: e.target.value })} placeholder="250" min="0" />
                </div>
                <div className="form-group">
                  <label>Years Experience</label>
                  <input type="number" value={providerForm.years_experience} onChange={(e) => setProviderForm({ ...providerForm, years_experience: e.target.value })} placeholder="5" min="0" />
                </div>
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea value={providerForm.bio} onChange={(e) => setProviderForm({ ...providerForm, bio: e.target.value })} rows={3} placeholder="Tell customers about your skills..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingRate(false); setProviderForm({ hourly_rate: providerProfile.hourly_rate, bio: providerProfile.bio, years_experience: providerProfile.years_experience }); }}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveProvider} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Hourly Rate</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>₹{providerProfile.hourly_rate}/hr</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Experience</p>
                <p style={{ fontSize: 22, fontWeight: 800 }}>{providerProfile.years_experience} yrs</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Rating</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{Number(providerProfile.avg_rating || 0).toFixed(1)} ★ <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>({providerProfile.total_reviews})</span></p>
              </div>
              {providerProfile.bio && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Bio</p>
                  <p style={{ fontSize: 14, lineHeight: 1.6 }}>{providerProfile.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity */}
      <div className="card" style={{ padding: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>Recent Activity</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Your latest bookings and actions</p>

        {loadingActivity ? (
          <div className="spinner">Loading activity...</div>
        ) : activity.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>
            <p>No activity yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activity.slice(0, 10).map((item, i) => {
              const svc = item._svc;
              const providerField = Object.keys(item).find((k) => k.endsWith('_name') && k !== 'consumer_name');
              const providerName = providerField ? item[providerField] : null;
              const consumerName = item.consumer_name || null;
              return (
                <div key={`${svc.key}-${item.id}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{svc.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{svc.label} {isProvider && consumerName ? `— ${consumerName}` : providerName ? `— ${providerName}` : ''}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {new Date(item.scheduled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {item.city ? ` · ${item.city}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.total_amount ? <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>₹{Number(item.total_amount).toFixed(0)}</span> : null}
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: item.status === 'completed' ? 'var(--success)' : item.status === 'cancelled' ? 'var(--danger)' : 'var(--muted)', padding: '3px 8px', background: item.status === 'completed' ? 'rgba(16,185,129,0.1)' : item.status === 'cancelled' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', borderRadius: 100 }}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
