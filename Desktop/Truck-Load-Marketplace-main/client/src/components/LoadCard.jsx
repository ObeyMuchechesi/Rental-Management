import { Badge } from './ui';
import { date, isLocked, money } from '../lib/format';

export default function LoadCard({ load, onUnlock, busy, footer }) {
  const locked = isLocked(load);
  const company = load.company || {};

  return (
    <div className="card flex flex-col p-5 transition hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone={load.status === 'open' ? 'emerald' : load.status === 'completed' ? 'indigo' : 'slate'}>
            {load.status}
          </Badge>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{load.cargoType}</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {company.name || 'Shipper'} · {load.weightTons}t
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-slate-900">{money(load.offeredRatePerKm)}/km</p>
          {load.totalOfferedRate ? (
            <p className="text-xs text-slate-500">{money(load.totalOfferedRate)} total</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
        <span className="font-medium">{load.pickup?.city}</span>
        <span className="text-slate-400">→</span>
        <span className="font-medium">{load.dropoff?.city}</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Pickup</dt>
          <dd className="font-semibold text-slate-900">{date(load.pickup?.date)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Delivery</dt>
          <dd className="font-semibold text-slate-900">{date(load.dropoff?.date)}</dd>
        </div>
        {load.status === 'completed' && load.completedAt && (
          <div className="col-span-2">
            <dt className="text-slate-500">Delivered</dt>
            <dd className="font-semibold text-indigo-700">{date(load.completedAt)}</dd>
          </div>
        )}
      </dl>

      {load.truckTypesRequired?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {load.truckTypesRequired.map((type) => (
            <span key={type} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {type}
            </span>
          ))}
        </div>
      )}

      <div
        className={`mt-4 rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200 transition ${
          locked ? 'select-none blur-[3px]' : ''
        }`}
      >
        <p className="text-slate-700">📞 {load.contactPhone}</p>
      </div>

      <div className="mt-auto pt-4">
        {footer ? (
          footer
        ) : locked ? (
          <button onClick={() => onUnlock(load)} disabled={busy} className="btn-primary w-full">
            {busy ? 'Unlocking…' : 'Unlock shipper · 1 credit'}
          </button>
        ) : (
          <a href={`tel:${load.contactPhone}`} className="btn-emerald w-full">
            Call shipper
          </a>
        )}
      </div>
    </div>
  );
}
