import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SERVICES, SERVICE_LIST } from '../config/services';

const SERVICE_TYPES = SERVICE_LIST.map((s) => ({ value: s.key.replace(/s$/, ''), label: `${s.icon} ${s.label}` }));

const EXTRA_FIELDS = {
  driver:      [{ name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: ['hatchback', 'sedan', 'suv', 'van'] }, { name: 'license_number', label: 'License Number', type: 'text' }, { name: 'languages', label: 'Languages Spoken', type: 'text', placeholder: 'Hindi, English' }],
  barber:      [{ name: 'specializations', label: 'Specializations', type: 'text', placeholder: 'Haircut, Beard Trim, Shave' }, { name: 'service_radius_km', label: 'Service Radius (km)', type: 'number' }],
  carpenter:   [{ name: 'wood_specialization', label: 'Wood Specialization', type: 'text', placeholder: 'Teak, Plywood, MDF' }, { name: 'has_own_tools', label: 'Has Own Tools', type: 'select', options: ['true', 'false'] }],
  electrician: [{ name: 'license_number', label: 'License Number', type: 'text' }, { name: 'available_emergency', label: 'Available for Emergencies', type: 'select', options: ['true', 'false'] }],
  lawyer:      [{ name: 'bar_registration', label: 'Bar Registration No.', type: 'text' }, { name: 'practice_areas', label: 'Practice Areas', type: 'text', placeholder: 'property,family,civil' }, { name: 'languages', label: 'Languages', type: 'text' }],
  labourer:    [{ name: 'skills', label: 'Skills', type: 'text', placeholder: 'moving,cleaning,loading' }, { name: 'daily_rate', label: 'Daily Rate (₹/worker/day)', type: 'number' }],
};

const initForm = {
  username: '', email: '', password: '', first_name: '', last_name: '',
  user_type: 'consumer', phone: '', city: '',
  service_type: '', hourly_rate: '', bio: '', years_experience: '',
};

export default function Register() {
  const location = useLocation();
  const initialType = location.state?.userType || 'consumer';
  const [form, setForm] = useState({ ...initForm, user_type: initialType });
  const [extra, setExtra] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isProvider = form.user_type === 'provider';
  const extraFields = EXTRA_FIELDS[form.service_type] || [];

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setEx = (e) => setExtra({ ...extra, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { hourly_rate, years_experience, bio, service_type, ...base } = form;
      const payload = isProvider
        ? { ...base, service_type, hourly_rate, years_experience, bio, ...extra }
        : base;
      await api.post('/api/auth/register/', payload);
      await login(form.username, form.password);
      navigate(isProvider ? '/jobs' : '/');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' · '));
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 24px 80px' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>Create your account</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.5px' }}>Register</h1>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Account type */}
          <div className="form-group">
            <label>I am a</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['consumer', '👤 Customer'], ['provider', '🧰 Service Provider']].map(([type, label]) => (
                <button key={type} type="button"
                  onClick={() => setForm({ ...form, user_type: type })}
                  style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 14, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                    background: form.user_type === type ? 'var(--accent)' : 'var(--surface2)',
                    color: form.user_type === type ? '#0D0D0F' : 'var(--muted)',
                    borderColor: form.user_type === type ? 'var(--accent)' : 'var(--border)',
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group"><label>First Name</label><input name="first_name" value={form.first_name} onChange={set} placeholder="Rajan" /></div>
            <div className="form-group"><label>Last Name</label><input name="last_name" value={form.last_name} onChange={set} placeholder="Sharma" /></div>
          </div>
          <div className="form-group"><label>Username *</label><input name="username" value={form.username} onChange={set} placeholder="rajan_sharma" required /></div>
          <div className="form-group"><label>Email</label><input type="email" name="email" value={form.email} onChange={set} placeholder="rajan@email.com" /></div>
          <div className="form-group"><label>Password *</label><input type="password" name="password" value={form.password} onChange={set} placeholder="Minimum 6 characters" required /></div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input name="phone" value={form.phone} onChange={set} placeholder="9999999999" /></div>
            <div className="form-group"><label>City</label><input name="city" value={form.city} onChange={set} placeholder="Mumbai" /></div>
          </div>

          {isProvider && (
            <>
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0 24px' }} />
              <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 16 }}>Provider Details</p>

              <div className="form-group">
                <label>Service Type *</label>
                <select name="service_type" value={form.service_type} onChange={(e) => { set(e); setExtra({}); }} required={isProvider}>
                  <option value="">Select your service</option>
                  {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group"><label>Hourly Rate (₹)</label><input type="number" name="hourly_rate" value={form.hourly_rate} onChange={set} placeholder="250" /></div>
                <div className="form-group"><label>Years Experience</label><input type="number" name="years_experience" value={form.years_experience} onChange={set} placeholder="5" /></div>
              </div>

              <div className="form-group"><label>Bio</label><textarea name="bio" value={form.bio} onChange={set} placeholder="Tell customers about your skills…" rows={3} style={{ resize: 'vertical' }} /></div>

              {extraFields.length > 0 && (
                <>
                  <div style={{ height: 1, background: 'var(--border)', margin: '8px 0 24px' }} />
                  <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: 16 }}>Service-Specific Info</p>
                  {extraFields.map((f) => (
                    <div className="form-group" key={f.name}>
                      <label>{f.label}</label>
                      {f.type === 'select' ? (
                        <select name={f.name} value={extra[f.name] || ''} onChange={setEx}>
                          <option value="">Select</option>
                          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={f.type} name={f.name} value={extra[f.name] || ''} onChange={setEx} placeholder={f.placeholder || ''} />
                      )}
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 8, fontSize: 15 }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
          Already have an account?{' '}<Link to="/login" state={{ userType: form.user_type }} style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
