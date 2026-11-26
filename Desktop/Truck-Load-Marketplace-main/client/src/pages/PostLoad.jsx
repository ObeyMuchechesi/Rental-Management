import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { Notice, PageHeader } from '../components/ui';
import { TRUCK_TYPES } from '../lib/format';

const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export default function PostLoad() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    cargoType: '',
    weightTons: '',
    truckTypesRequired: [],
    pickupCity: '',
    pickupDate: inDays(1),
    pickupLat: '',
    pickupLng: '',
    dropoffCity: '',
    dropoffDate: inDays(2),
    dropoffLat: '',
    dropoffLng: '',
    offeredRatePerKm: '',
    totalOfferedRate: '',
    contactPhone: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const toggleType = (type) =>
    setForm((current) => ({
      ...current,
      truckTypesRequired: current.truckTypesRequired.includes(type)
        ? current.truckTypesRequired.filter((value) => value !== type)
        : [...current.truckTypesRequired, type],
    }));

  const coords = (lat, lng) =>
    lat !== '' && lng !== '' ? [Number(lng), Number(lat)] : undefined;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/loads', {
        cargoType: form.cargoType,
        weightTons: Number(form.weightTons),
        truckTypesRequired: form.truckTypesRequired,
        pickup: {
          city: form.pickupCity,
          date: form.pickupDate || undefined,
          coordinates: coords(form.pickupLat, form.pickupLng),
        },
        dropoff: {
          city: form.dropoffCity,
          date: form.dropoffDate || undefined,
          coordinates: coords(form.dropoffLat, form.dropoffLng),
        },
        offeredRatePerKm: Number(form.offeredRatePerKm),
        totalOfferedRate: form.totalOfferedRate ? Number(form.totalOfferedRate) : undefined,
        contactPhone: form.contactPhone,
      });
      navigate(`/search/${data._id}`);
    } catch (err) {
      setError(errorMessage(err, 'Could not post the load.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="New load"
        title="Post a load"
        description="Tell us the route, the cargo and the rate you will pay. Matching trucks already accept that rate."
      />

      {error && <Notice tone="error">{error}</Notice>}

      <form onSubmit={submit} className="card space-y-6 p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cargoType">
              Cargo
            </label>
            <input
              id="cargoType"
              className="input"
              value={form.cargoType}
              onChange={set('cargoType')}
              placeholder="Bagged cement, diesel, produce…"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="weightTons">
              Weight (tons)
            </label>
            <input
              id="weightTons"
              type="number"
              min="0.1"
              step="0.1"
              className="input"
              value={form.weightTons}
              onChange={set('weightTons')}
              required
            />
          </div>
        </div>

        <div>
          <p className="label">Truck types that can carry it</p>
          <div className="flex flex-wrap gap-2">
            {TRUCK_TYPES.map((type) => {
              const selected = form.truckTypesRequired.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ring-1 transition ${
                    selected
                      ? 'bg-indigo-600 text-white ring-indigo-600'
                      : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">Leave empty to accept any truck type.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <fieldset className="space-y-3">
            <legend className="label">Pickup</legend>
            <input
              className="input"
              value={form.pickupCity}
              onChange={set('pickupCity')}
              placeholder="City"
              required
            />
            <input type="date" className="input" value={form.pickupDate} onChange={set('pickupDate')} />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input"
                value={form.pickupLat}
                onChange={set('pickupLat')}
                placeholder="Latitude (optional)"
                inputMode="decimal"
              />
              <input
                className="input"
                value={form.pickupLng}
                onChange={set('pickupLng')}
                placeholder="Longitude"
                inputMode="decimal"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="label">Dropoff</legend>
            <input
              className="input"
              value={form.dropoffCity}
              onChange={set('dropoffCity')}
              placeholder="City"
              required
            />
            <input type="date" className="input" value={form.dropoffDate} onChange={set('dropoffDate')} />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input"
                value={form.dropoffLat}
                onChange={set('dropoffLat')}
                placeholder="Latitude (optional)"
                inputMode="decimal"
              />
              <input
                className="input"
                value={form.dropoffLng}
                onChange={set('dropoffLng')}
                placeholder="Longitude"
                inputMode="decimal"
              />
            </div>
          </fieldset>
        </div>

        <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 ring-1 ring-slate-200">
          Coordinates are optional. With them we search trucks in a radius around pickup; without them we
          match on the pickup city.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="offeredRatePerKm">
              Offered rate per km (USD)
            </label>
            <input
              id="offeredRatePerKm"
              type="number"
              min="0.01"
              step="0.01"
              className="input"
              value={form.offeredRatePerKm}
              onChange={set('offeredRatePerKm')}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="totalOfferedRate">
              Total offer (optional)
            </label>
            <input
              id="totalOfferedRate"
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={form.totalOfferedRate}
              onChange={set('totalOfferedRate')}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="contactPhone">
            Contact phone
          </label>
          <input
            id="contactPhone"
            className="input"
            value={form.contactPhone}
            onChange={set('contactPhone')}
            placeholder="+254…"
            required
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Masked for carriers until they unlock it with a credit or an active plan.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          <p className="text-sm text-slate-500">You will see matching trucks right after posting.</p>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Posting…' : 'Post load & find trucks'}
          </button>
        </div>
      </form>
    </div>
  );
}
