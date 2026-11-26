import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import PaywallModal, { usePaywall } from '../components/PaywallModal';
import { Notice, PageHeader } from '../components/ui';
import { TRUCK_TYPES } from '../lib/format';
import { compressPhoto } from '../lib/photo';

const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export default function PostTruck() {
  const navigate = useNavigate();
  const paywall = usePaywall();
  const [form, setForm] = useState({
    type: 'flatbed',
    plateNumber: '',
    capacityTons: '',
    capacityVolumeM3: '',
    city: '',
    lat: '',
    lng: '',
    availableFrom: inDays(0),
    availableUntil: inDays(14),
    minRatePerKm: '',
    contactPhone: '',
    exactAddress: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const pickPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const dataUrl = await compressPhoto(file);
      setPhoto(dataUrl);
      setPhotoName(file.name);
    } catch (err) {
      setPhoto('');
      setPhotoName('');
      setPhotoError(err.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!photo) {
      setError('Upload a clear picture of the truck before publishing.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.post('/trucks', {
        type: form.type,
        plateNumber: form.plateNumber,
        capacityTons: Number(form.capacityTons),
        capacityVolumeM3: form.capacityVolumeM3 ? Number(form.capacityVolumeM3) : undefined,
        city: form.city,
        coordinates:
          form.lat !== '' && form.lng !== '' ? [Number(form.lng), Number(form.lat)] : undefined,
        availableFrom: form.availableFrom || undefined,
        availableUntil: form.availableUntil,
        minRatePerKm: Number(form.minRatePerKm),
        contactPhone: form.contactPhone,
        exactAddress: form.exactAddress,
        photo,
      });
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status !== 402) {
        setError(errorMessage(err, 'Could not list the truck.'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="New truck"
        title="List a truck"
        description="Shippers only see you when your type, capacity, availability and minimum rate all match their load."
      />

      {error && <Notice tone="error">{error}</Notice>}

      <form onSubmit={submit} className="card space-y-6 p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="type">
              Truck type
            </label>
            <select id="type" className="input capitalize" value={form.type} onChange={set('type')}>
              {TRUCK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="plateNumber">
              Plate number
            </label>
            <input
              id="plateNumber"
              className="input"
              value={form.plateNumber}
              onChange={set('plateNumber')}
              placeholder="KDG 412X"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="capacityTons">
              Capacity (tons)
            </label>
            <input
              id="capacityTons"
              type="number"
              min="0.1"
              step="0.1"
              className="input"
              value={form.capacityTons}
              onChange={set('capacityTons')}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="capacityVolumeM3">
              Volume (m³, optional)
            </label>
            <input
              id="capacityVolumeM3"
              type="number"
              min="0"
              step="0.1"
              className="input"
              value={form.capacityVolumeM3}
              onChange={set('capacityVolumeM3')}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="city">
              Current city
            </label>
            <input id="city" className="input" value={form.city} onChange={set('city')} required />
          </div>
          <div>
            <label className="label" htmlFor="lat">
              Latitude (optional)
            </label>
            <input id="lat" className="input" value={form.lat} onChange={set('lat')} inputMode="decimal" />
          </div>
          <div>
            <label className="label" htmlFor="lng">
              Longitude (optional)
            </label>
            <input id="lng" className="input" value={form.lng} onChange={set('lng')} inputMode="decimal" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="availableFrom">
              Available from
            </label>
            <input
              id="availableFrom"
              type="date"
              className="input"
              value={form.availableFrom}
              onChange={set('availableFrom')}
            />
          </div>
          <div>
            <label className="label" htmlFor="availableUntil">
              Available until
            </label>
            <input
              id="availableUntil"
              type="date"
              className="input"
              value={form.availableUntil}
              onChange={set('availableUntil')}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="minRatePerKm">
              Minimum rate per km (USD)
            </label>
            <input
              id="minRatePerKm"
              type="number"
              min="0.01"
              step="0.01"
              className="input"
              value={form.minRatePerKm}
              onChange={set('minRatePerKm')}
              required
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Trucks are matched when this is at or below the shipper's offer.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="contactPhone">
              Dispatch phone
            </label>
            <input
              id="contactPhone"
              className="input"
              value={form.contactPhone}
              onChange={set('contactPhone')}
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="exactAddress">
            Exact address (hidden until unlocked)
          </label>
          <input id="exactAddress" className="input" value={form.exactAddress} onChange={set('exactAddress')} />
        </div>

        <div>
          <p className="label">Truck picture</p>
          <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
            <div>
              <label
                htmlFor="truck-photo"
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${
                  photo
                    ? 'border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50'
                    : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40'
                }`}
              >
                <span className="text-2xl">{photo ? '✅' : '📷'}</span>
                <span className="mt-2 text-sm font-semibold text-slate-800">
                  {photoBusy ? 'Processing picture…' : photo ? photoName || 'Photo ready' : 'Choose a truck photo'}
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  {photo ? 'Click to replace the picture' : 'JPG, PNG or WebP · compressed automatically'}
                </span>
              </label>
              <input
                id="truck-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={pickPhoto}
              />
              <p className="mt-2 text-xs text-slate-500">
                A clear picture of the truck is required so shippers know exactly what is arriving.
              </p>
              {photoError && <p className="mt-1 text-xs text-rose-600">{photoError}</p>}
            </div>

            <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
              {photo ? (
                <img src={photo} alt="Truck preview" className="h-full w-full object-cover" />
              ) : (
                <span className="px-4 text-center text-xs text-slate-500">Photo preview</span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
          Listing a truck uses <strong>1 credit</strong>, or is unlimited on the monthly plan.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          <p className="text-sm text-slate-500">
            {photo ? 'Ready to publish.' : 'Add the truck photo to continue.'}
          </p>
          <button type="submit" disabled={busy || photoBusy || !photo} className="btn-primary">
            {busy ? 'Listing…' : 'List truck'}
          </button>
        </div>
      </form>

      <PaywallModal open={paywall.open} message={paywall.message} onClose={paywall.closePaywall} />
    </div>
  );
}
