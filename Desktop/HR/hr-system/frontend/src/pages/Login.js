import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (mode === 'login') {
      const res = await login(form.email, form.password);
      if (res.success) navigate('/');
      else setError(res.message);
    } else {
      try {
        await register(form.name, form.email, form.password, form.role);
        navigate('/');
      } catch (err) {
        setError(err.response?.data?.message || 'Registration failed');
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <p>{mode === 'login' ? 'Sign in to your HR dashboard' : 'Set up your admin account'}</p>
        {error && <div className="badge badge-red" style={{ display: 'block', marginBottom: 16, textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          {mode === 'register' && (
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>
          )}
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 500 }}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
        {mode === 'login' && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
            First time? Click Register to create an admin user.
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
