import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import CheckoutModal from '../components/CheckoutModal';
import PlanBanner from '../components/PlanBanner';
import { Badge, Notice, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { date, money, paymentTone } from '../lib/format';

const METHOD_LABELS = { ecocash: 'EcoCash', onemoney: 'OneMoney', card: 'Card', hosted: 'PayNow', manual: 'Manual' };

export default function Pricing() {
  const { user, subscription, refresh, refreshSubscription } = useAuth();
  const [searchParams] = useSearchParams();
  const [checkout, setCheckout] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [payments, setPayments] = useState([]);
  const [checking, setChecking] = useState('');
  const confirmedRef = useRef(new Set());

  const userId = user?._id;
  const returnReference = searchParams.get('payment') === 'return' ? searchParams.get('reference') : null;

  const loadPayments = useCallback(async () => {
    if (!userId) {
      setPayments([]);
      return;
    }
    try {
      const { data } = await api.get('/plans/payments');
      setPayments(data);
    } catch {
      // Billing history is supplemental; the plans still work without it.
    }
  }, [userId]);

  useEffect(() => {
    loadPayments();
    if (userId) refreshSubscription();
  }, [loadPayments, refreshSubscription, userId]);

  const mergePayment = useCallback((payment) => {
    setPayments((current) => {
      const exists = current.some((row) => row.reference === payment.reference);
      return exists
        ? current.map((row) => (row.reference === payment.reference ? payment : row))
        : [payment, ...current];
    });
  }, []);

  const applyResult = useCallback(
    async (data) => {
      mergePayment(data.payment);
      if (data.payment.status === 'paid') {
        setNotice(
          data.payment.plan === 'monthly'
            ? 'Payment received. Your monthly plan is active — contacts and truck listings are unlocked.'
            : `Payment received. ${data.payment.credits} credits were added to your account.`
        );
        setError('');
        await Promise.all([refresh(), refreshSubscription()]);
        return true;
      }
      if (data.payment.status === 'failed' || data.payment.status === 'cancelled') {
        setError(
          data.payment.status === 'cancelled'
            ? 'That payment was cancelled. Nothing was charged.'
            : 'PayNow could not complete that payment. You can try again.'
        );
        return true;
      }
      return false;
    },
    [mergePayment, refresh, refreshSubscription]
  );

  // PayNow sends the browser back here; poll until the payment is confirmed.
  useEffect(() => {
    if (!userId || !returnReference || confirmedRef.current.has(returnReference)) return undefined;
    let cancelled = false;

    const poll = async (attempt) => {
      try {
        const { data } = await api.get(`/plans/payments/${returnReference}/status`);
        const done = await applyResult(data);
        if (done) {
          confirmedRef.current.add(returnReference);
          return;
        }
        if (cancelled || attempt >= 9) {
          if (!cancelled) {
            setNotice('PayNow is still confirming this payment. Use "Check status" below in a moment.');
          }
          return;
        }
        setTimeout(() => {
          if (!cancelled) poll(attempt + 1);
        }, 3000);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not confirm the payment yet.'));
      }
    };

    poll(0);
    return () => {
      cancelled = true;
    };
  }, [applyResult, returnReference, userId]);

  const start = (kind) => {
    setError('');
    setNotice('');
    setCheckout(kind);
  };

  const checkStatus = async (payment) => {
    setChecking(payment.reference);
    setError('');
    try {
      const { data } = await api.get(`/plans/payments/${payment.reference}/status`);
      const done = await applyResult(data);
      if (!done) setNotice('PayNow has not confirmed this payment yet. Check again in a moment.');
    } catch (err) {
      setError(errorMessage(err, 'Could not check that payment.'));
    } finally {
      setChecking('');
    }
  };

  const pendingPayment = useMemo(
    () => payments.find((payment) => payment.status === 'pending'),
    [payments]
  );

  const monthlyActive = !!subscription?.active;
  const monthlyExpired = !!subscription?.expired;

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
      features: [
        '20 credits per pack',
        'Credits never expire',
        'One credit per truck listing',
        'Works for both sides',
      ],
      action: { kind: 'credits', label: 'Buy 20 credits' },
    },
    {
      name: 'Monthly',
      price: money(29),
      cadence: 'per 30 days',
      description: 'For companies that move freight every week.',
      features: ['Unlimited contact unlocks', 'Unlimited truck listings', 'Full contact details in lists', 'No auto-renewal'],
      highlight: true,
      action: {
        kind: 'monthly',
        label: monthlyActive ? 'Extend 30 days' : monthlyExpired ? 'Renew monthly' : 'Subscribe monthly',
      },
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pricing & billing"
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

      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {pendingPayment && (
        <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Payment awaiting confirmation</p>
            <p className="mt-0.5 text-sm text-slate-600">
              {pendingPayment.planName} · {money(pendingPayment.amount, pendingPayment.currency)} ·{' '}
              {METHOD_LABELS[pendingPayment.method] || 'PayNow'} · started {date(pendingPayment.createdAt)}
            </p>
            {pendingPayment.instructions && (
              <p className="mt-1 text-sm text-slate-500">{pendingPayment.instructions}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingPayment.browserUrl && (
              <a href={pendingPayment.browserUrl} className="btn-primary">
                Complete with PayNow
              </a>
            )}
            <button
              type="button"
              onClick={() => checkStatus(pendingPayment)}
              disabled={checking === pendingPayment.reference}
              className="btn-ghost"
            >
              {checking === pendingPayment.reference ? 'Checking…' : 'Check status'}
            </button>
          </div>
        </div>
      )}

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
                    className={`w-full ${plan.highlight ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {plan.action.label}
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

      {user && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Payment history</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Every PayNow payment and manual activation on your company account.
              </p>
            </div>
            <button type="button" onClick={loadPayments} className="btn-ghost">
              Refresh
            </button>
          </div>

          {payments.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              No payments yet. Choose a plan above to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Reference</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payments.map((payment) => (
                    <tr key={payment.reference}>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{payment.reference}</td>
                      <td className="px-6 py-4 text-slate-700">
                        {payment.planName}
                        {payment.credits ? ` · ${payment.credits} credits` : ''}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {money(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={paymentTone(payment.status)}>{payment.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{date(payment.paidAt || payment.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        {payment.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            {payment.browserUrl && (
                              <a href={payment.browserUrl} className="text-sm font-semibold text-indigo-700 hover:underline">
                                PayNow
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => checkStatus(payment)}
                              disabled={checking === payment.reference}
                              className="text-sm font-semibold text-slate-600 hover:underline disabled:opacity-60"
                            >
                              {checking === payment.reference ? 'Checking…' : 'Check'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {payment.provider === 'manual' ? 'Manual' : 'PayNow'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
              An active monthly plan removes all unlock costs, makes truck listings unlimited, and shows full
              contact details in every list until the period ends.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Paying in the app</p>
            <p className="mt-1">
              EcoCash and OneMoney are charged right here: approve the PIN prompt on your phone and the plan
              activates without leaving this page. Nothing is charged until you approve.
            </p>
          </div>
        </div>
      </div>

      <CheckoutModal
        open={!!checkout}
        presetPlan={checkout || 'credits'}
        onClose={() => {
          setCheckout(null);
          loadPayments();
        }}
        onPaid={loadPayments}
        title="Pay for TruckLink"
      />
    </div>
  );
}
