import { Link } from 'react-router-dom';
import { date } from '../lib/format';

export default function PlanBanner({ sub }) {
  const active = !!sub?.active;
  const expired = !!sub?.expired;

  const headline = active
    ? 'Monthly plan'
    : expired
      ? 'Monthly plan expired'
      : sub?.plan === 'per_use'
        ? 'Pay as you go'
        : 'Free';

  const hint = active
    ? `Unlimited unlocks and listings until ${date(sub.currentPeriodEnd)}${sub.daysLeft ? ` · ${sub.daysLeft} days left` : ''}`
    : expired
      ? `Expired ${date(sub.currentPeriodEnd)} — contacts and full details are locked until you renew.`
      : sub?.plan === 'per_use'
        ? `${sub.credits ?? 0} credits left · 1 credit per unlock or listing`
        : 'Browse masked listings. Upgrade to unlock contacts and publish trucks.';

  return (
    <div
      className={`rounded-2xl p-5 text-white shadow-sm ${
        expired
          ? 'bg-gradient-to-r from-amber-500 to-orange-600'
          : 'bg-gradient-to-r from-indigo-600 to-violet-600'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={`text-sm ${expired ? 'text-amber-100' : 'text-indigo-100'}`}>Current plan</p>
          <p className="text-xl font-semibold">{headline}</p>
          <p className={`mt-1 max-w-xl text-sm ${expired ? 'text-amber-50' : 'text-indigo-100'}`}>{hint}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {active && (
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm">
              Unlimited unlocks
            </span>
          )}
          {!active && sub?.plan === 'per_use' && (
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm">
              {sub.credits ?? 0} credits left
            </span>
          )}
          <Link
            to="/pricing"
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              expired ? 'bg-white text-amber-700 hover:bg-amber-50' : 'bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            {active ? 'Manage billing' : expired ? 'Renew now' : 'Upgrade'}
          </Link>
        </div>
      </div>
    </div>
  );
}
