import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Could not sign in.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 py-8 lg:grid-cols-[1fr_420px] lg:items-center">
      <div className="hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Welcome back</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          The right truck is one unlock away.
        </h1>
        <p className="mt-4 max-w-md text-slate-600">
          Sign in to manage your fleet, post loads and see which trucks already accept your rate.
        </p>
        <figure className="relative mt-8 overflow-hidden rounded-2xl ring-1 ring-slate-900/10">
          <img
            src="/photos/scania-lineup-bw.jpg"
            alt="Line of Scania trucks parked at a depot"
            className="h-56 w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 p-5 text-sm font-semibold text-white">
            Carriers list the fleet. Shippers post the load.
          </figcaption>
        </figure>
        <div className="mt-6 rounded-2xl bg-slate-100 p-5 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Demo accounts</p>
          <p className="mt-2">Carrier — ops@kilimanjaro.test · Carrier@123</p>
          <p>Shipper — dispatch@savannah.test · Shipper@123</p>
          <p>Admin — admin@trucklink.test · Admin@12345</p>
        </div>
      </div>

      <form onSubmit={submit} className="card p-7">
        <h2 className="text-xl font-bold text-slate-900">Sign in</h2>
        <p className="mt-1 text-sm text-slate-600">Use your company account.</p>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </div>
        )}

        <div className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="you@company.com"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          No account?{' '}
          <Link to="/register" className="font-semibold text-indigo-700 hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
