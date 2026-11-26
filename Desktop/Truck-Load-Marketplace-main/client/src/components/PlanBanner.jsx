import { Link } from 'react-router-dom';
import { date } from '../lib/format';

export default function PlanBanner({ sub }) {
  const active = sub?.plan === 'monthly' && sub?.status === 'active';

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-sm">
      <div>
        <p className="text-sm text-indigo-100">Current plan</p>
        <p className="text-xl font-semibold capitalize">
          {sub?.plan === 'per_use' ? 'Pay as you go' : active ? 'Monthly' : 'Free'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {sub?.plan === 'per_use' && (
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm">
            {sub.credits ?? 0} credits left
          </span>
        )}
        {active && sub?.currentPeriodEnd && (
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm">
            Renews {date(sub.currentPeriodEnd)}
          </span>
        )}
        {!active && sub?.plan !== 'per_use' && (
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm">
            Unlock details with credits or a monthly plan
          </span>
        )}
        <Link
          to="/pricing"
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          {active ? 'Manage plan' : 'Upgrade'}
        </Link>
      </div>
    </div>
  );
}
