import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';
import LoadCard from '../components/LoadCard';
import PaywallModal, { usePaywall } from '../components/PaywallModal';
import { EmptyState, Loader, Notice, PageHeader } from '../components/ui';
import { TRUCK_TYPES } from '../lib/format';

export default function BrowseLoads() {
  const paywall = usePaywall();
  const [loads, setLoads] = useState([]);
  const [filters, setFilters] = useState({ truckType: '', minRate: '', city: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(null);

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.truckType) params.truckType = filters.truckType;
      if (filters.minRate) params.minRate = filters.minRate;
      if (filters.city) params.city = filters.city;
      const { data } = await api.get('/loads', { params });
      setLoads(data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load open loads.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  const unlock = async (load) => {
    setUnlocking(load._id);
    try {
      const { data } = await api.get(`/loads/${load._id}`);
      setLoads((current) => current.map((item) => (item._id === data._id ? data : item)));
    } catch {
      // 402 is handled by the interceptor.
    } finally {
      setUnlocking(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Load board"
        title="Open loads"
        description="Shipper contact details stay masked until you unlock them with a credit or your monthly plan."
      />

      <div className="card flex flex-wrap items-end gap-4 p-5">
        <div className="min-w-[160px]">
          <label className="label" htmlFor="truckType">
            Truck type
          </label>
          <select
            id="truckType"
            className="input capitalize"
            value={filters.truckType}
            onChange={(event) => setFilters({ ...filters, truckType: event.target.value })}
          >
            <option value="">Any</option>
            {TRUCK_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="label" htmlFor="minRate">
            Min rate / km
          </label>
          <input
            id="minRate"
            type="number"
            min="0"
            step="0.05"
            className="input"
            value={filters.minRate}
            onChange={(event) => setFilters({ ...filters, minRate: event.target.value })}
            placeholder="1.20"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="label" htmlFor="city">
            Pickup city
          </label>
          <input
            id="city"
            className="input"
            value={filters.city}
            onChange={(event) => setFilters({ ...filters, city: event.target.value })}
            placeholder="Nairobi"
          />
        </div>
        <button
          type="button"
          onClick={() => setFilters({ truckType: '', minRate: '', city: '' })}
          className="btn-ghost"
        >
          Reset
        </button>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {loading ? (
        <Loader label="Loading loads…" />
      ) : loads.length === 0 ? (
        <EmptyState
          title="No open loads match those filters"
          description="Clear the filters or check back later — new loads appear as shippers post them."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loads.map((load) => (
            <LoadCard key={load._id} load={load} onUnlock={unlock} busy={unlocking === load._id} />
          ))}
        </div>
      )}

      <PaywallModal open={paywall.open} message={paywall.message} onClose={paywall.closePaywall} />
    </div>
  );
}
