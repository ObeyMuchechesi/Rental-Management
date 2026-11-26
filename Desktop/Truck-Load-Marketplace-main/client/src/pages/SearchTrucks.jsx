import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PaywallModal, { usePaywall } from '../components/PaywallModal';
import TruckCard from '../components/TruckCard';
import { EmptyState, Loader, Notice, PageHeader } from '../components/ui';
import { date, money } from '../lib/format';

const RADII = [50, 150, 300, 600];

export default function SearchTrucks() {
  const { loadId } = useParams();
  const paywall = usePaywall();
  const { refreshSubscription } = useAuth();
  const [load, setLoad] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [radius, setRadius] = useState(150);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(null);

  useEffect(() => {
    api
      .get('/loads/mine')
      .then(({ data }) => setLoad(data.find((item) => item._id === loadId) || null))
      .catch(() => {});
  }, [loadId]);

  const fetchTrucks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/trucks/match/${loadId}`, { params: { radiusKm: radius } });
      setTrucks(data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load matching trucks.'));
    } finally {
      setLoading(false);
    }
  }, [loadId, radius]);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  const unlock = async (truck) => {
    setUnlocking(truck._id);
    try {
      const { data } = await api.get(`/trucks/${truck._id}`);
      setTrucks((current) => current.map((item) => (item._id === data._id ? data : item)));
      // Keep the header credit counter in sync with the credit just spent.
      await refreshSubscription();
    } catch {
      // 402 is handled by the axios interceptor, which opens the paywall.
    } finally {
      setUnlocking(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Matching trucks"
        title="Trucks that accept your rate"
        description={
          load
            ? `${load.pickup?.city} → ${load.dropoff?.city} · ${load.weightTons}t ${load.cargoType} · offering ${money(load.offeredRatePerKm)}/km`
            : 'Available trucks filtered by route, capacity and the rate you offered.'
        }
        action={
          <Link to="/dashboard" className="btn-ghost">
            Back to dashboard
          </Link>
        }
      />

      {load && (
        <div className="card flex flex-wrap items-center gap-6 p-5 text-sm">
          <div>
            <p className="text-slate-500">Pickup</p>
            <p className="font-semibold text-slate-900">{load.pickup?.city}</p>
            <p className="text-slate-500">{date(load.pickup?.date)}</p>
          </div>
          <div className="text-slate-400">→</div>
          <div>
            <p className="text-slate-500">Dropoff</p>
            <p className="font-semibold text-slate-900">{load.dropoff?.city}</p>
            <p className="text-slate-500">{date(load.dropoff?.date)}</p>
          </div>
          <div>
            <p className="text-slate-500">Offer</p>
            <p className="font-semibold text-slate-900">{money(load.offeredRatePerKm)}/km</p>
            {load.totalOfferedRate ? (
              <p className="text-slate-500">{money(load.totalOfferedRate)} total</p>
            ) : null}
          </div>
          <div>
            <p className="text-slate-500">Truck types</p>
            <p className="font-semibold capitalize text-slate-900">
              {load.truckTypesRequired?.length ? load.truckTypesRequired.join(', ') : 'Any'}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {loading ? 'Searching…' : `${trucks.length} trucks match this load`}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="radius" className="text-sm text-slate-500">
            Search radius
          </label>
          <select
            id="radius"
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
            className="rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-300"
          >
            {RADII.map((value) => (
              <option key={value} value={value}>
                {value} km
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {loading ? (
        <Loader label="Matching trucks…" />
      ) : trucks.length === 0 ? (
        <EmptyState
          title="No trucks accept this rate yet"
          description="Try raising the offered rate, widening the radius, or allowing more truck types."
          action={
            <Link to="/loads/new" className="btn-primary">
              Post another load
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trucks.map((truck) => (
            <TruckCard
              key={truck._id}
              truck={truck}
              onUnlock={unlock}
              busy={unlocking === truck._id}
            />
          ))}
        </div>
      )}

      <PaywallModal open={paywall.open} message={paywall.message} onClose={paywall.closePaywall} />
    </div>
  );
}
