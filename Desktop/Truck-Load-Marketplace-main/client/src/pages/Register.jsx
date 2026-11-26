import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: 'shipper',
    name: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Get started</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Create your company account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Carriers list trucks. Shippers post loads. Both sides pay only when they connect.
        </p>
      </div>

      <div className="relative mt-6 overflow-hidden rounded-3xl ring-1 ring-slate-900/10">
        <img
          src="/photos/tanker-terminal.jpg"
          alt="Fuel tanker at a terminal during sunset"
          className="h-40 w-full object-cover object-center sm:h-48"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent" />
        <p className="absolute inset-y-0 left-0 flex max-w-xs items-center px-6 text-sm font-semibold text-white sm:max-w-sm sm:px-8 sm:text-base">
          From quarry to terminal — one account covers both sides of the load.
        </p>
      </div>

      <form onSubmit={submit} className="card mt-6 p-7">
        {error && (
          <div className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: 'shipper', title: 'Shipper / driver', body: 'Post loads and unlock carrier contacts.' },
            { value: 'carrier', title: 'Carrier', body: 'List trucks and unlock shipper contacts.' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setForm({ ...form, role: option.value })}
              className={`rounded-2xl p-4 text-left ring-1 transition ${
                form.role === option.value
                  ? 'bg-indigo-50 ring-2 ring-indigo-600'
                  : 'bg-white ring-slate-200 hover:bg-slate-50'
              }`}
            >
              <p className="font-semibold text-slate-900">{option.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">{option.body}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              Your name
            </label>
            <input id="name" className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="label" htmlFor="companyName">
              Company name
            </label>
            <input
              id="companyName"
              className="input"
              value={form.companyName}
              onChange={set('companyName')}
              placeholder="Optional for individuals"
            />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className="input" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={form.password}
              onChange={set('password')}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <input id="phone" className="input" value={form.phone} onChange={set('phone')} placeholder="+254…" />
          </div>
          <div>
            <label className="label" htmlFor="address">
              Address
            </label>
            <input id="address" className="input" value={form.address} onChange={set('address')} />
          </div>
        </div>

        {form.role === 'carrier' && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
            Carrier companies are reviewed by an admin before trucks can be listed.
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
          {busy ? 'Creating account…' : 'Create account'}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-indigo-700 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
