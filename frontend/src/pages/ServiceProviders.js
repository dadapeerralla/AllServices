import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { SERVICES } from '../config/services';

function StarRating({ rating }) {
  const full = Math.round(rating || 0);
  return <span className="stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>;
}

export default function ServiceProviders() {
  const { serviceKey } = useParams();
  const navigate = useNavigate();
  const svc = SERVICES[serviceKey];

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (!svc) return;
    setLoading(true);
    const params = new URLSearchParams(filters).toString();
    api.get(`${svc.apiBase}/providers/${params ? '?' + params : ''}`)
      .then((r) => setProviders(r.data))
      .finally(() => setLoading(false));
  }, [svc, filters]);

  if (!svc) return (
    <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
      <h2>Service not found</h2>
    </div>
  );

  const handleFilter = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({ ...prev, [name]: type === 'checkbox' ? (checked ? 'true' : '') : value }));
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to Home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 40 }}>{svc.icon}</span>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>{svc.label}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{svc.description}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32, padding: 20, background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        {svc.filterFields.map((f) => (
          <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {f.type === 'checkbox' ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>
                <input type="checkbox" name={f.name} onChange={handleFilter} style={{ width: 'auto', accentColor: 'var(--accent)' }} />
                {f.label}
              </label>
            ) : (
              <input
                type="text"
                name={f.name}
                placeholder={`Filter by ${f.label}`}
                onChange={handleFilter}
                style={{ width: 180 }}
              />
            )}
          </div>
        ))}
        <span style={{ fontSize: 13, color: 'var(--muted)', alignSelf: 'center' }}>
          {loading ? 'Loading…' : `${providers.length} available`}
        </span>
      </div>

      {/* Provider Grid */}
      {loading ? (
        <div className="spinner">Loading providers…</div>
      ) : providers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
          <p>No {svc.label.toLowerCase()} found. Try changing your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} svc={svc} navigate={navigate} serviceKey={serviceKey} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProviderCard({ provider, svc, navigate, serviceKey }) {
  const user = provider.user_details || {};
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Provider';

  return (
    <div
      onClick={() => navigate(`/service/${serviceKey}/provider/${provider.id}`)}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = svc.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Avatar + name */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${svc.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {svc.icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user.city}</div>
        </div>
        {provider.is_verified && (
          <div style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 100 }}>✓ Verified</div>
        )}
      </div>

      {/* Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <StarRating rating={provider.avg_rating} />
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {Number(provider.avg_rating || 0).toFixed(1)} ({provider.total_reviews} reviews)
        </span>
      </div>

      {/* Bio */}
      {provider.bio && (
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {provider.bio}
        </p>
      )}

      {/* Profile chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {provider.years_experience && (
          <span style={{ fontSize: 12, padding: '3px 10px', background: 'var(--surface2)', borderRadius: 100, color: 'var(--muted)' }}>{provider.years_experience}y exp</span>
        )}
        {svc.profileFields.map((field) => provider[field] && (
          <span key={field} style={{ fontSize: 12, padding: '3px 10px', background: 'var(--surface2)', borderRadius: 100, color: 'var(--muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {String(provider[field])}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: svc.color }}>₹{provider.hourly_rate}/hr</span>
        <span style={{ fontSize: 13, color: svc.color, fontWeight: 600 }}>View Profile →</span>
      </div>
    </div>
  );
}
