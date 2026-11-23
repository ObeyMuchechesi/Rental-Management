import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { api, setToken } from '../api';
import logoMark from '../assets/logo-mark.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const d = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
      setToken(d.token);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-950 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-soft sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-950 p-1.5 ring-1 ring-gold-500/40">
            <img src={logoMark} alt="" aria-hidden="true" className="h-full w-full object-contain" />
          </div>
          <h1 className="mt-5 text-center font-display text-2xl font-bold text-brand-950">Admin Login</h1>
          <p className="mt-1 text-center text-sm text-brand-600">Sign in to manage inquiries, services and website content.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@primeaccess.co.zw" required autoComplete="username" />
            </div>
            <div>
              <label className="label" htmlFor="admin-pass">Password</label>
              <div className="relative">
                <input id="admin-pass" type={show ? 'text' : 'password'} className="input pr-11" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-700" aria-label="Toggle password visibility">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
              {loading ? <><Loader2 size={17} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-brand-500">
            First time? The default admin account is created from the server's <code className="rounded bg-brand-50 px-1">.env</code> / seed script - change the password after logging in.
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-brand-300 hover:text-white"><ArrowLeft size={15} /> Back to website</Link>
        </div>
      </div>
    </div>
  );
}