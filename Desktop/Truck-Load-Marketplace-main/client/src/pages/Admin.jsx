import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';
import { Badge, Loader, Notice, PageHeader, StatCard } from '../components/ui';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsResponse, companiesResponse] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/companies'),
      ]);
      setStats(statsResponse.data);
      setCompanies(companiesResponse.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load admin data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleVerified = async (company) => {
    setBusyId(company._id);
    try {
      const { data } = await api.post(`/admin/companies/${company._id}/verify`, {
        verified: !company.verified,
      });
      setCompanies((current) => current.map((item) => (item._id === data._id ? data : item)));
      load();
    } catch (err) {
      setError(errorMessage(err, 'Could not update the company.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Marketplace control room"
        description="Approve carrier companies and watch unlock activity across the marketplace."
        action={
          <button type="button" onClick={load} className="btn-ghost">
            Refresh
          </button>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}

      {loading ? (
        <Loader label="Loading admin data…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Companies"
              value={stats?.companies.total ?? 0}
              hint={`${stats?.companies.verified ?? 0} verified · ${stats?.companies.carriers ?? 0} carriers`}
            />
            <StatCard
              label="Trucks"
              value={stats?.trucks.total ?? 0}
              hint={`${stats?.trucks.available ?? 0} available`}
            />
            <StatCard
              label="Unlocks"
              value={stats?.unlocks.total ?? 0}
              hint={`${stats?.unlocks.byMethod.credit ?? 0} credits · ${stats?.unlocks.byMethod.subscription ?? 0} subscriptions`}
            />
            <StatCard
              label="Active subscriptions"
              value={stats?.subscriptions.active ?? 0}
              hint={`${stats?.subscriptions.creditsOutstanding ?? 0} credits outstanding`}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">Top companies by unlocks</h2>
              {stats?.unlocks.topCompanies?.length ? (
                <ul className="mt-4 divide-y divide-slate-200 text-sm">
                  {stats.unlocks.topCompanies.map((row) => (
                    <li key={row.name} className="flex items-center justify-between py-2.5">
                      <span className="text-slate-700">{row.name}</span>
                      <span className="font-semibold text-slate-900">{row.unlocks}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No unlocks recorded yet.</p>
              )}
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">Busiest routes</h2>
              {stats?.topRoutes?.length ? (
                <ul className="mt-4 divide-y divide-slate-200 text-sm">
                  {stats.topRoutes.map((row) => (
                    <li key={row.route} className="flex items-center justify-between py-2.5">
                      <span className="text-slate-700">{row.route}</span>
                      <span className="font-semibold text-slate-900">{row.loads} loads</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No loads posted yet.</p>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Companies</h2>
              <p className="text-sm text-slate-500">{companies.length} total</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Company</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {companies.map((company) => (
                    <tr key={company._id}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{company.name}</p>
                        <p className="text-xs text-slate-500">{company.address || '—'}</p>
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-600">{company.type}</td>
                      <td className="px-6 py-4 text-slate-600">{company.phone || '—'}</td>
                      <td className="px-6 py-4">
                        {company.verified ? (
                          <Badge tone="emerald">Verified</Badge>
                        ) : (
                          <Badge tone="amber">Pending</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => toggleVerified(company)}
                          disabled={busyId === company._id}
                          className={company.verified ? 'btn-ghost' : 'btn-primary'}
                        >
                          {busyId === company._id ? 'Saving…' : company.verified ? 'Revoke' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
