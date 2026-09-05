import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const active = (path) => location.pathname === path
    ? { color: 'var(--text)', borderBottom: '2px solid var(--accent)' }
    : {};

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(13,13,15,0.92)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>
          <span style={{ color: 'var(--accent)' }}>ALL</span>
          <span style={{ color: 'var(--text)' }}>SERVICES</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link to="/" style={{ padding: '8px 14px', fontSize: 14, color: 'var(--muted)', borderBottom: '2px solid transparent', transition: 'color 0.15s', ...active('/') }}>Home</Link>

          {user?.user_type === 'consumer' && (
            <Link to="/dashboard" style={{ padding: '8px 14px', fontSize: 14, color: 'var(--muted)', borderBottom: '2px solid transparent', ...active('/dashboard') }}>My Bookings</Link>
          )}
          {user?.user_type === 'provider' && (
            <Link to="/jobs" style={{ padding: '8px 14px', fontSize: 14, color: 'var(--muted)', borderBottom: '2px solid transparent', ...active('/jobs') }}>My Jobs</Link>
          )}

          {!user ? (
            <>
              <Link to="/login" style={{ padding: '8px 14px', fontSize: 14, color: 'var(--muted)', borderBottom: '2px solid transparent', ...active('/login') }}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}>Register</Link>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
              <Link to="/profile" style={{ padding: '4px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 100, fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s' }}>
                {user.first_name || user.username}
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
