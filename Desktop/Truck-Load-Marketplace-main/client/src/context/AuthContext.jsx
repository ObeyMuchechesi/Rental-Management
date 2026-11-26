import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return null;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setSubscription(data.subscription);
      return data.user;
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      setSubscription(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    try {
      const { data: sub } = await api.get('/plans/me');
      setSubscription(sub);
    } catch {
      setSubscription(null);
    }
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setSubscription(null);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSubscription(null);
  };

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setSubscription(data.subscription);
      return data.subscription;
    } catch {
      return null;
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    try {
      const { data } = await api.get('/plans/me');
      setSubscription(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  const value = {
    user,
    subscription,
    loading,
    login,
    register,
    logout,
    refresh,
    refreshSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
