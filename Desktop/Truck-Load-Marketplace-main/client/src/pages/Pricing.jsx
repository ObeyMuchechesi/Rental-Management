import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import PlanBanner from '../components/PlanBanner';
import { Notice, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { money } from '../lib/format';

export default function Pricing() {
  const { user, subscription } = useAuth();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const start = async (kind) => {
    setBusy(kind);
    setError('');
    try {
      const { data } = await api.post(kind === 'monthly' ? '/plans/subscribe' : '/plans/credits');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(errorMessage(err, 'Could not start checkout.'));
      setBusy('');
    }
  };

  const plans = [
    {
      name: 'Free',
      price: money(0),
      cadence: 'forever',
      description: 'See what is on the board before you pay.',
      features: ['Browse masked trucks and loads', 'Post loads', 'No contact details'],
      action: null,
    },
    {
      name: 'Pay as you go',
      price: money(10),
      cadence: 'per 20 credits',
      description: 'One credit unlocks one truck or one shipper contact.',
      features: ['20 credits per pack', 'Credits never expire', 'Unlimited browsing', 'Works for both sides'],
      action: { kind: 'credits', label: 'Buy 20 credits' },
    },
    {
      name: 'Monthly',
      price: money(29),
      cadence: 'per month',
      description: 'For companies that move freight every week.',
      features: ['Unlimited unlocks', 'Unlimited truck listings', 'Priority matching', 'Cancel anytime'],
      highlight: true,
      action: { kind: 'monthly', label: 'Subscribe monthly' },
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pricing"
        title="Both sides pay only when they connect"
        description="Carriers pay to be listed. Shippers pay to unlock truck details. Everyone can browse and post for free."
      />

      <div className="relative overflow-hidden rounded-3xl ring-1 ring-slate-900/10">
        <img
          src="/photos/tanker-fleet.jpg"
          alt="Polished tanker trailers lined up at a depot"
          className="h-44 w-full object-cover object-center sm:h-56"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/10" />
        <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center px-6 text-white sm:px-9">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Pay for results</p>
          <p className="mt-2 text-2xl font-bold leading-snug sm:text-3xl">
            No listing fees. No cold calls. Just freight.
          </p>
        </div>
      </div>

      {user && <PlanBanner sub={subscription} />}

      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className={`card flex flex-col p-7 ${plan.highlight ? 'ring-2 ring-indigo-600' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
              {plan.highlight && <span className="pill bg-indigo-50 text-indigo-700">Most popular</span>}
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{plan.price}</p>
            <p className="text-sm text-slate-500">{plan.cadence}</p>
            <p className="mt-3 text-sm text-slate-600">{plan.description}</p>

            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-6">
              {plan.action ? (
                user ? (
                  <button
                    type="button"
                    onClick={() => start(plan.action.kind)}
                    disabled={!!busy}
                    className={`w-full ${plan.highlight ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {busy === plan.action.kind ? 'Starting…' : plan.action.label}
                  </button>
                ) : (
                  <Link to="/register" className="btn-primary w-full">
                    Create an account
                  </Link>
                )
              ) : (
                <span className="block rounded-xl bg-slate-50 px-4 py-2.5 text-center text-sm font-medium text-slate-500">
                  Included with every account
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-7">
        <h2 className="text-lg font-semibold text-slate-900">How billing works</h2>
        <div className="mt-4 grid gap-6 text-sm text-slate-600 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-900">Credits</p>
            <p className="mt-1">
              One credit unlocks one truck's phone number and exact location — or one shipper's contact
              details. An unlock is never charged twice.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Subscriptions</p>
            <p className="mt-1">
              An active monthly plan removes all unlock costs and makes truck listings unlimited until the
              period ends.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Checkout</p>
            <p className="mt-1">
              Payments run through Stripe Checkout. Credits and plan status are applied by a verified
              webhook, not by the browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
