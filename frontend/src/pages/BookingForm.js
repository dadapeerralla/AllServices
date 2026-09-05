import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { SERVICES } from '../config/services';

export default function BookingForm() {
  const { serviceKey, providerId } = useParams();
  const navigate = useNavigate();
  const svc = SERVICES[serviceKey];

  const [provider, setProvider] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!svc) return;
    api.get(`${svc.apiBase}/providers/${providerId}/`)
      .then((r) => {
        setProvider(r.data);
        const defaults = {};
        svc.bookingFields.forEach((f) => { defaults[f.name] = f.type === 'number' ? (f.min || 1) : ''; });
        setForm(defaults);
      })
      .finally(() => setFetchLoading(false));
  }, [svc, providerId]);

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const providerField = svc.key.replace(/s$/, '');
    const userId = provider.user_details?.id || Number(providerId);
    try {
      await api.post(`${svc.apiBase}/bookings/`, { ...form, [providerField]: userId });
      setSuccess('Booking confirmed! Redirecting…');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' · '));
      } else {
        setError('Booking failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!svc) return <div className="spinner">Service not found.</div>;
  if (fetchLoading) return <div className="spinner">Loading…</div>;
  if (!provider) return <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--muted)' }}>Provider not found.</div>;

  const userDetails = provider.user_details || {};
  const name = [userDetails.first_name, userDetails.last_name].filter(Boolean).join(' ') || userDetails.username;
  const minDateTime = (() => { const d = new Date(); d.setMinutes(d.getMinutes() + 30); return d.toISOString().slice(0, 16); })();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 24px 80px' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', marginBottom: 24, padding: 0 }}>← Back</button>

        <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>New Booking</p>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Book {name}</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}>{svc.label} · {userDetails.city} · ₹{provider.hourly_rate}/hr</p>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 14 }}>{error}</div>}
        {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--success)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 14 }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {svc.bookingFields.map((f) => (
            <div className="form-group" key={f.name}>
              <label>{f.label}{f.required ? ' *' : ''}</label>
              {f.type === 'select' ? (
                <select name={f.name} value={form[f.name] || ''} onChange={handleChange} required={f.required}>
                  <option value="">Select</option>
                  {f.options.map((o) => <option key={o} value={o}>{String(o).replace(/_/g, ' ')}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea name={f.name} value={form[f.name] || ''} onChange={handleChange} placeholder={f.placeholder || ''} rows={2} style={{ resize: 'vertical' }} />
              ) : (
                <input
                  type={f.type}
                  name={f.name}
                  value={form[f.name] || ''}
                  onChange={handleChange}
                  placeholder={f.placeholder || ''}
                  min={f.type === 'datetime-local' ? minDateTime : f.min}
                  required={f.required}
                />
              )}
            </div>
          ))}

          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>Estimated Total</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>Calculated on confirmation</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--muted)' }}>₹{provider.hourly_rate}/hr</div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
