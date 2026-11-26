import { Badge } from './ui';
import { date, isLocked, money } from '../lib/format';
import { truckPhoto } from '../lib/photo';

export default function TruckCard({ truck, onUnlock, busy }) {
  const locked = isLocked(truck);
  const company = truck.company || {};
  const photo = truckPhoto(truck);

  return (
    <div className="card flex flex-col overflow-hidden transition hover:shadow-card">
      {photo ? (
        <img src={photo} alt={`${company.name || 'Carrier'} ${truck.type} truck`} className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-4xl">
          🚛
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge tone="indigo">{truck.type}</Badge>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              {truck.capacityTons}t · {truck.currentLocation?.city}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
              {company.name || 'Carrier'}
              {company.verified && <span className="text-emerald-600" title="Verified carrier">✓</span>}
            </p>
          </div>
          {typeof truck.distanceKm === 'number' && (
            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              {truck.distanceKm} km away
            </span>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Min rate</dt>
            <dd className="font-semibold text-slate-900">
              {money(truck.minRatePerKm, truck.currency)}/km
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Available until</dt>
            <dd className="font-semibold text-slate-900">{date(truck.availableUntil)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Plate</dt>
            <dd className="font-semibold text-slate-900">{truck.plateNumber}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="font-semibold capitalize text-slate-900">{truck.status}</dd>
          </div>
        </dl>

        <div
          className={`mt-4 rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200 transition ${
            locked ? 'select-none blur-[3px]' : ''
          }`}
        >
          <p className="text-slate-700">📞 {truck.contactPhone}</p>
          <p className="text-slate-500">{truck.exactAddress || 'Exact address hidden'}</p>
        </div>

        <div className="mt-auto pt-4">
          {locked ? (
            <button onClick={() => onUnlock(truck)} disabled={busy} className="btn-primary w-full">
              {busy ? 'Unlocking…' : 'Unlock contact · 1 credit'}
            </button>
          ) : (
            <a href={`tel:${truck.contactPhone}`} className="btn-emerald w-full">
              Call carrier
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
