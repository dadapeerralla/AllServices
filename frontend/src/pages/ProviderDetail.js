import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SERVICES } from '../config/services';

function Stars({ rating }) {
  const n = Math.round(Number(rating || 0));
  return <span className="stars">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}

export default function ProviderDetail() {
  const { serviceKey, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const svc = SERVICES[serviceKey];
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!svc) return;
    Promise.all([
      api.get(`${svc.apiBase}/providers/${id}/`),
      api.get(`${svc.apiBase}/reviews/provider/${id}/`),
    ])
      .then(([pRes, rRes]) => { setProvider(pRes.data); setReviews(rRes.data); })
      .finally(() => setLoading(false));
  }, [svc, id]);

  if (!svc) return <div className="container spinner">Service not found.</div>;
  if (loading) return <div className="spinner">Loading provider…</div>;
  if (!provider) return <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--muted)' }}>Provider not found.</div>;

  const userDetails = provider.user_details || {};
  const name = [userDetails.first_name, userDetails.last_name].filter(Boolean).join(' ') || userDetails.username || 'Provider';

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 840 }}>
      <button onClick={() => navigate(`/service/${serviceKey}`)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', marginBottom: 24, padding: 0 }}>
        ← Back to {svc.label}
      </button>

      {/* Header Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: `${svc.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
            {svc.icon}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{name}</h1>
              {provider.is_verified && <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 100 }}>✓ Verified</span>}
              {provider.is_available
                ? <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: 100 }}>Available</span>
                : <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', background: 'var(--surface2)', padding: '3px 10px', borderRadius: 100 }}>Unavailable</span>
              }
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 10 }}>{svc.label} · {userDetails.city}</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Stars rating={provider.avg_rating} />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{Number(provider.avg_rating || 0).toFixed(1)} ({provider.total_reviews} reviews)</span>
              </div>
              {provider.years_experience && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{provider.years_experience} years experience</span>}
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: svc.color, letterSpacing: '-1px' }}>₹{provider.hourly_rate}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>per hour</div>
            {user?.user_type === 'consumer' && provider.is_available && (
              <button className="btn btn-primary" onClick={() => navigate(`/service/${serviceKey}/book/${id}`)}>Book Now</button>
            )}
            {!user && (
              <button className="btn btn-primary" onClick={() => navigate('/login', { state: { from: `/service/${serviceKey}/provider/${id}` } })}>Login to Book</button>
            )}
          </div>
        </div>

        {provider.bio && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>
            {provider.bio}
          </div>
        )}

        {/* Service-specific profile details */}
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {svc.profileFields.map((field) => provider[field] !== undefined && provider[field] !== null && (
            <div key={field} style={{ padding: '8px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
              <span style={{ color: 'var(--muted)', marginRight: 6 }}>{field.replace(/_/g, ' ')}:</span>
              <span style={{ fontWeight: 600 }}>{String(provider[field])}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600 }}>Reviews</span>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>What Customers Say</h2>
        </div>

        {reviews.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <p>No reviews yet. Be the first!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, marginRight: 10 }}>{r.reviewer_name}</span>
                    <Stars rating={r.rating} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {r.comment && <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
