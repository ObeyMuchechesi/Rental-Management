import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';
import { Badge, Loader, Notice, PageHeader, StatCard } from '../components/ui';
import { date, money, paymentTone } from '../lib/format';

const planTone = (subscription) => {
  if (subscription?.active) return 'emerald';
  if (subscription?.expired) return 'amber';
  if (subscription?.plan === 'per_use') return 'indigo';
  return 'slate';
};

const planText = (subscription) => {
  if (subscription?.active) return `Monthly · ${date(subscription.currentPeriodEnd)}`;
  if (subscription?.expired) return `Expired ${date(subscription.currentPeriodEnd)}`;
  if (subscription?.plan === 'per_use') return `${subscription.credits ?? 0} credits`;
  return 'Free';
};

const mixBar = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  indigo: 'bg-indigo-500',
  slate: 'bg-slate-300',
};

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const [overviewResponse, companiesResponse, paymentsResponse] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/companies'),
        api.get('/admin/payments', { params: { limit: 60 } }),
      ]);
      setOverview(overviewResponse.data);
      setCompanies(companiesResponse.data);
      setPayments(paymentsResponse.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the super admin console.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const verify = async (company) => {
    setBusy(`verify-${company._id}`);
    setError('');
    try {
      await api.post(`/admin/companies/${company._id}/verify`, { verified: !company.verified });
      setNotice(`${company.name} ${company.verified ? 'set back to pending' : 'verified'}.`);
      await load({ quiet: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not update that company.'));
    } finally {
      setBusy('');
    }
  };

  const grant = async (company, plan) => {
    setBusy(`grant-${plan}-${company._id}`);
    setError('');
    try {
      await api.post(`/admin/companies/${company._id}/subscription`, {
        plan,
        ...(plan === 'monthly' ? { days: 30 } : { credits: 20 }),
        note: `Granted by super admin (${plan})`,
      });
      setNotice(
        plan === 'monthly'
          ? `30 days of monthly access granted to ${company.name}.`
          : `20 credits added to ${company.name}.`
      );
      await load({ quiet: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not grant that plan.'));
    } finally {
      setBusy('');
    }
  };

  const activate = async (payment) => {
    setBusy(`pay-${payment._id}`);
    setError('');
    try {
      await api.post(`/admin/payments/${payment._id}/activate`);
      setNotice(`Payment ${payment.reference} marked paid and activated.`);
      await load({ quiet: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not activate that payment.'));
    } finally {
      setBusy('');
    }
  };

  if (loading && !overview) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Super admin" title="System console" description="Loading the business overview…" />
        <Loader label="Loading super admin console…" />
      </div>
    );
  }

  const kpis = overview?.kpis;
  const revenueSeries = overview?.revenueSeries || [];
  const maxRevenue = Math.max(...revenueSeries.map((row) => row.revenue), 1);
  const planMix = overview?.planMix || [];
  const mixTotal = planMix.reduce((total, row) => total + row.value, 0) || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super admin"
        title="System console"
        description="Companies, revenue, subscription health and completed rides across the whole marketplace."
        action={
          <button type="button" onClick={() => load()} className="btn-ghost">
            Refresh
          </button>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-900 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Business overview</p>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {money(kpis?.revenue.allTime ?? 0)}
            </p>
            <p className="mt-1 text-sm text-indigo-100">
              Total collected · {money(kpis?.revenue.thisMonth ?? 0)} this month · {money(kpis?.revenue.mrr ?? 0)} MRR
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <p className="text-indigo-200">Companies</p>
              <p className="text-2xl font-bold">{kpis?.companies.total ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <p className="text-indigo-200">Completed rides</p>
              <p className="text-2xl font-bold">{kpis?.rides.completed ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <p className="text-indigo-200">Active monthly</p>
              <p className="text-2xl font-bold">{kpis?.subscriptions.activeMonthly ?? 0}</p>
            </div>
          </div>
        </div>
        <p className="relative mt-6 text-xs text-indigo-200">
          Live snapshot · {overview?.generatedAt ? new Date(overview.generatedAt).toLocaleString() : '—'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={money(kpis?.revenue.allTime ?? 0)}
          hint={`${kpis?.revenue.paidCount ?? 0} paid · ${kpis?.revenue.pendingCount ?? 0} pending`}
        />
        <StatCard
          label="Monthly recurring"
          value={money(kpis?.revenue.mrr ?? 0)}
          hint={`${kpis?.subscriptions.activeMonthly ?? 0} active subscribers`}
        />
        <StatCard
          label="Completed rides"
          value={kpis?.rides.completed ?? 0}
          hint={`${kpis?.rides.completionRate ?? 0}% of all posted loads`}
        />
        <StatCard
          label="Credit balance"
          value={kpis?.subscriptions.creditsOutstanding ?? 0}
          hint="credits held by customers"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Companies"
          value={kpis?.companies.total ?? 0}
          hint={`${kpis?.companies.carriers ?? 0} carriers · ${kpis?.companies.shippers ?? 0} shippers`}
        />
        <StatCard
          label="Verification queue"
          value={kpis?.companies.pending ?? 0}
          hint={`${kpis?.companies.verified ?? 0} verified · ${kpis?.companies.newThisMonth ?? 0} new this month`}
        />
        <StatCard
          label="Fleet"
          value={kpis?.fleet.total ?? 0}
          hint={`${kpis?.fleet.available ?? 0} available now`}
        />
        <StatCard
          label="Unlocks"
          value={kpis?.marketplace.unlocks ?? 0}
          hint={`${kpis?.marketplace.creditUnlocks ?? 0} credits · ${kpis?.marketplace.subscriptionUnlocks ?? 0} subscription`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Revenue and completed rides</h2>
              <p className="text-sm text-slate-500">Last six months of PayNow and manual payments.</p>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {money(revenueSeries.reduce((total, row) => total + row.revenue, 0))} in 6 months
            </p>
          </div>

          <div className="mt-6 flex h-48 items-end gap-3 sm:gap-5">
            {revenueSeries.map((row) => (
              <div key={row.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-600">{money(row.revenue)}</span>
                <div className="flex h-32 w-full items-end">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-indigo-600 to-violet-400 transition-all"
                    style={{ height: `${Math.max(4, (row.revenue / maxRevenue) * 100)}%` }}
                    title={`${row.label}: ${money(row.revenue)} · ${row.rides} rides`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">{row.label}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">{row.rides} rides</span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-3">
            <p className="text-slate-600">
              Avg load value <span className="font-semibold text-slate-900">{money(kpis?.marketplace.avgLoadValue ?? 0)}</span>
            </p>
            <p className="text-slate-600">
              Open loads <span className="font-semibold text-slate-900">{kpis?.rides.open ?? 0}</span>
            </p>
            <p className="text-slate-600">
              Rides completed this month <span className="font-semibold text-slate-900">{kpis?.rides.completedThisMonth ?? 0}</span>
            </p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Plan mix</h2>
          <p className="text-sm text-slate-500">Subscription health across all companies.</p>

          <div className="mt-5 space-y-4">
            {planMix.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-semibold text-slate-900">{row.value}</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${mixBar[row.tone] || mixBar.slate}`}
                    style={{ width: `${Math.max(2, (row.value / mixTotal) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
            <p className="flex items-center justify-between">
              <span>Expired plans</span>
              <span className="font-semibold text-amber-700">{kpis?.subscriptions.expiredMonthly ?? 0}</span>
            </p>
            <p className="mt-2 flex items-center justify-between">
              <span>Pay as you go</span>
              <span className="font-semibold text-indigo-700">{kpis?.subscriptions.perUse ?? 0}</span>
            </p>
            <p className="mt-2 flex items-center justify-between">
              <span>Free accounts</span>
              <span className="font-semibold text-slate-700">{kpis?.subscriptions.free ?? 0}</span>
            </p>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-900">Busiest routes</h3>
            {overview?.topRoutes?.length ? (
              <ul className="mt-2 divide-y divide-slate-100 text-sm">
                {overview.topRoutes.map((row) => (
                  <li key={row.route} className="flex items-center justify-between py-2">
                    <span className="truncate text-slate-600">{row.route}</span>
                    <span className="ml-3 shrink-0 font-semibold text-slate-900">{row.loads}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No loads posted yet.</p>
            )}
          </div>
        </div>
      </div>

      {overview?.pendingCompanies?.length > 0 && (
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Verification queue</h2>
              <p className="text-sm text-slate-500">Approve companies so their carriers can publish trucks.</p>
            </div>
            <Badge tone="amber">{overview.pendingCompanies.length} waiting</Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {overview.pendingCompanies.map((company) => (
              <div key={company._id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">{company.name}</p>
                  <p className="text-xs capitalize text-slate-500">
                    {company.type} · joined {date(company.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => verify(company)}
                  disabled={busy === `verify-${company._id}`}
                  className="btn-primary"
                >
                  {busy === `verify-${company._id}` ? 'Saving…' : 'Verify'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Companies</h2>
            <p className="text-sm text-slate-500">Plans, verification and marketplace activity per company.</p>
          </div>
          <p className="text-sm text-slate-500">{companies.length} companies</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Activity</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {companies.map((company) => (
                <tr key={company._id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{company.name}</p>
                    <p className="text-xs text-slate-500">{company.phone || company.address || '—'}</p>
                  </td>
                  <td className="px-6 py-4 capitalize text-slate-600">{company.type}</td>
                  <td className="px-6 py-4">
                    <Badge tone={planTone(company.subscription)}>{planText(company.subscription)}</Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {company.trucks} trucks · {company.loads} loads
                  </td>
                  <td className="px-6 py-4">
                    {company.verified ? <Badge tone="emerald">Verified</Badge> : <Badge tone="amber">Pending</Badge>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => grant(company, 'credits')}
                        disabled={busy === `grant-credits-${company._id}`}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 disabled:opacity-60"
                      >
                        {busy === `grant-credits-${company._id}` ? 'Saving…' : '+20 credits'}
                      </button>
                      <button
                        type="button"
                        onClick={() => grant(company, 'monthly')}
                        disabled={busy === `grant-monthly-${company._id}`}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        {busy === `grant-monthly-${company._id}` ? 'Saving…' : '+30 days'}
                      </button>
                      <button
                        type="button"
                        onClick={() => verify(company)}
                        disabled={busy === `verify-${company._id}`}
                        className={company.verified ? 'btn-ghost' : 'btn-primary'}
                      >
                        {busy === `verify-${company._id}` ? '…' : company.verified ? 'Revoke' : 'Verify'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
            <p className="text-sm text-slate-500">
              PayNow payments and manual activations. Pending rows can be confirmed manually.
            </p>
          </div>
          <p className="text-sm text-slate-500">{payments.length} recent payments</p>
        </div>
        {payments.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{payment.reference}</td>
                    <td className="px-6 py-4 text-slate-700">{payment.company?.name || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {payment.planName}
                      {payment.credits ? ` · ${payment.credits} credits` : ''}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {money(payment.amount, payment.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={paymentTone(payment.status)}>{payment.status}</Badge>
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">
                        {payment.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{date(payment.paidAt || payment.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => activate(payment)}
                          disabled={busy === `pay-${payment._id}`}
                          className="btn-primary"
                        >
                          {busy === `pay-${payment._id}` ? 'Activating…' : 'Mark paid'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
