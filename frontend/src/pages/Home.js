import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVICE_LIST } from '../config/services';

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      {/* Ticker */}
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

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .svc-card:hover { border-color: var(--accent) !important; transform: translateY(-3px); }
      `}</style>

      {/* Hero */}
      <div className="container" style={{ paddingTop: 80, paddingBottom: 64 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20, fontWeight: 600 }}>
          Pan-India On-Demand Platform
        </p>
        <h1 style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', fontWeight: 800, lineHeight: 1, letterSpacing: '-2px', marginBottom: 24 }}>
          Every Pro<br /><span style={{ color: 'var(--accent)' }}>At Your Door.</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 480, lineHeight: 1.7, marginBottom: 40 }}>
          Verified drivers, barbers, carpenters, electricians, lawyers, and labourers — one platform, instant booking, right at your doorstep.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => navigate('/register')} style={{ fontSize: 15, padding: '12px 28px' }}>Get Started</button>
          <button className="btn btn-ghost" onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: 15, padding: '12px 28px' }}>Browse Services</button>
        </div>
      </div>

      {/* Stats */}
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
  );
}
