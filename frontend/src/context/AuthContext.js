import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/profile/');
      setUser(res.data);
    } catch {
      localStorage.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('access')) {
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = async (username, password) => {
    const res = await api.post('/api/auth/token/', { username, password });
    localStorage.setItem('access', res.data.access);
    localStorage.setItem('refresh', res.data.refresh);
    const profileRes = await api.get('/api/auth/profile/');
    setUser(profileRes.data);
    return profileRes.data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
