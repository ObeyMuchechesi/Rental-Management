import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PlanBanner from '../components/PlanBanner';
import LoadCard from '../components/LoadCard';
import { Badge, EmptyState, Loader, Notice, PageHeader, StatCard } from '../components/ui';
import { date, money } from '../lib/format';
import { truckPhoto } from '../lib/photo';

export default function Dashboard() {
  const { user, subscription, refreshSubscription } = useAuth();
  const [trucks, setTrucks] = useState([]);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        await refreshSubscription();
        if (user.role === 'carrier') {
          const { data } = await api.get('/trucks/mine');
          if (!cancelled) setTrucks(data);
        } else if (user.role === 'shipper') {
          const { data } = await api.get('/loads/mine');
          if (!cancelled) setLoads(data);
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load your dashboard.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user.role, refreshSubscription]);

  const isCarrier = user.role === 'carrier';
  const isShipper = user.role === 'shipper';
  const isAdmin = user.role === 'admin';

  const availableTrucks = trucks.filter((truck) => truck.status === 'available').length;
  const openLoads = loads.filter((load) => load.status === 'open').length;
  const completedLoads = loads.filter((load) => load.status === 'completed').length;
  const offeredValue = loads.reduce((total, load) => total + (Number(load.totalOfferedRate) || 0), 0);

  const completeLoad = async (load) => {
    setActionId(load._id);
    setError('');
    try {
      const { data } = await api.post(`/loads/${load._id}/complete`);
      setLoads((current) => current.map((item) => (item._id === data._id ? data : item)));
      setNotice(`“${data.cargoType}” marked delivered — it now counts as a completed ride.`);
    } catch (err) {
      setError(errorMessage(err, 'Could not mark that load delivered.'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${user.role} workspace`}
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        description={
          isCarrier
            ? 'Keep your fleet listed and find shipper loads that match your rate.'
            : isShipper
              ? 'Post a load, review matching trucks and unlock the carriers you want.'
              : 'Approve companies and watch marketplace activity.'
        }
        action={
          isCarrier ? (
            <Link to="/trucks/new" className="btn-primary">
              Add a truck
            </Link>
          ) : isShipper ? (
            <Link to="/loads/new" className="btn-primary">
              Post a load
            </Link>
          ) : (
            <Link to="/admin" className="btn-primary">
              Open admin
            </Link>
          )
        }
      />

      {user.company?.name && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{user.company.name}</span>
          {user.company.verified ? <Badge tone="emerald">Verified</Badge> : <Badge tone="amber">Pending verification</Badge>}
          {user.company.rating ? <span>★ {user.company.rating.toFixed(1)}</span> : null}
        </div>
      )}

      {!isAdmin && <PlanBanner sub={subscription} />}

      {!isAdmin && subscription?.expired && (
        <Notice tone="warning">
          Your monthly plan expired on {date(subscription.currentPeriodEnd)}. Contacts, exact locations and
          unmasked lists stay locked until you renew.{' '}
          <Link to="/pricing" className="font-semibold underline">
            Renew now
          </Link>
        </Notice>
      )}

      {isCarrier && !user.company?.verified && (
        <Notice tone="warning">
          Your company is waiting for admin verification. You can prepare your fleet details, but trucks
          cannot be listed until an admin approves the account.
        </Notice>
      )}

      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {loading ? (
        <Loader label="Loading your workspace…" />
      ) : isCarrier ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Trucks listed" value={trucks.length} hint={`${availableTrucks} available now`} />
            <StatCard
              label="Lowest rate"
              value={trucks.length ? money(Math.min(...trucks.map((t) => t.minRatePerKm))) : '—'}
              hint="per km"
            />
            <StatCard label="Plan" value={subscription?.plan === 'per_use' ? 'Pay as you go' : subscription?.plan || 'free'} hint={`${subscription?.credits ?? 0} credits`} />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Your fleet</h2>
              <Link to="/loads" className="text-sm font-semibold text-indigo-700 hover:underline">
                Find loads →
              </Link>
            </div>

            {trucks.length === 0 ? (
              <EmptyState
                title="No trucks listed yet"
                description="Add your first truck so shippers can find you. Listing uses one credit, or is unlimited on the monthly plan."
                action={
                  <Link to="/trucks/new" className="btn-primary">
                    Add a truck
                  </Link>
                }
              />
            ) : (
              <div className="card divide-y divide-slate-200">
                {trucks.map((truck) => (
                  <div key={truck._id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div className="flex items-center gap-4">
                      {truckPhoto(truck) ? (
                        <img
                          src={truckPhoto(truck)}
                          alt={`${truck.plateNumber} ${truck.type}`}
                          className="h-16 w-24 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="grid h-16 w-24 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl">🚛</div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge tone="indigo">{truck.type}</Badge>
                          <span className="text-sm font-semibold text-slate-900">{truck.plateNumber}</span>
                          <Badge tone={truck.status === 'available' ? 'emerald' : 'slate'}>{truck.status}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {truck.capacityTons}t · {truck.currentLocation?.city} · available until{' '}
                          {date(truck.availableUntil)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-slate-900">{money(truck.minRatePerKm)}/km minimum</p>
                      <p className="text-slate-500">{truck.contactPhone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : isShipper ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Loads posted" value={loads.length} hint={`${openLoads} still open`} />
            <StatCard label="Completed rides" value={completedLoads} hint="confirmed deliveries" />
            <StatCard label="Offered value" value={money(offeredValue)} hint="across all your loads" />
            <StatCard
              label={subscription?.active ? 'Monthly plan' : 'Credits'}
              value={subscription?.active ? `${subscription.daysLeft} days left` : subscription?.credits ?? 0}
              hint={subscription?.active ? 'unlimited unlocks' : '1 credit per unlock'}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Your loads</h2>
              <Link to="/pricing" className="text-sm font-semibold text-indigo-700 hover:underline">
                Buy credits →
              </Link>
            </div>

            {loads.length === 0 ? (
              <EmptyState
                title="No loads posted yet"
                description="Post your route, cargo and the rate you will pay. We will show the trucks that accept it."
                action={
                  <Link to="/loads/new" className="btn-primary">
                    Post a load
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loads.map((load) => (
                  <LoadCard
                    key={load._id}
                    load={load}
                    footer={
                      load.status === 'completed' ? (
                        <div className="rounded-xl bg-indigo-50 px-3 py-2.5 text-center text-sm font-semibold text-indigo-700">
                          Delivered · completed ride
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          <Link to={`/search/${load._id}`} className="btn-primary w-full">
                            Find matching trucks
                          </Link>
                          <button
                            type="button"
                            onClick={() => completeLoad(load)}
                            disabled={actionId === load._id}
                            className="btn-ghost w-full"
                          >
                            {actionId === load._id ? 'Saving…' : 'Mark delivered'}
                          </button>
                        </div>
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <EmptyState
          title="Admin workspace"
          description="Review company verification requests and marketplace activity from the admin panel."
          action={
            <Link to="/admin" className="btn-primary">
              Open admin panel
            </Link>
          }
        />
      )}
    </div>
  );
}
