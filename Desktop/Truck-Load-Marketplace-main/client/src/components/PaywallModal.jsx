import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';

export function usePaywall() {
  const [state, setState] = useState({ open: false, message: '' });

  useEffect(() => {
    const onPaywall = (event) => {
      setState({ open: true, message: event.detail?.message || '' });
    };
    window.addEventListener('paywall', onPaywall);
    return () => window.removeEventListener('paywall', onPaywall);
  }, []);

  return {
    open: state.open,
    message: state.message,
    openPaywall: () => setState({ open: true, message: '' }),
    closePaywall: () => setState({ open: false, message: '' }),
  };
}

export default function PaywallModal({ open, message, onClose }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setBusy(null);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const buy = async (kind) => {
    setBusy(kind);
    setError('');
    try {
      const { data } = await api.post(kind === 'monthly' ? '/plans/subscribe' : '/plans/credits');
      const target = data.redirectUrl || data.url;
      if (!target) throw new Error(data.message || 'PayNow did not return a checkout link.');
      window.location.href = target;
    } catch (err) {
      setError(errorMessage(err, 'Could not start checkout.'));
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-900">Unlock contact details</h2>
        <p className="mt-1 text-sm text-slate-600">
          {message || 'Choose a plan to see phone numbers, exact locations and contact the other side directly.'}
        </p>
        <p className="mt-2 text-xs text-slate-500">Secure payment via PayNow Zimbabwe (USD). Your plan activates automatically.</p>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </div>
        )}

        <div className="mt-5 grid gap-3">
          <button
            onClick={() => buy('monthly')}
            disabled={!!busy}
            className="rounded-2xl border-2 border-indigo-600 p-4 text-left transition hover:bg-indigo-50 disabled:opacity-60"
          >
            <p className="font-semibold text-indigo-700">
              Monthly — $29/mo {busy === 'monthly' && '· starting…'}
            </p>
            <p className="text-sm text-slate-600">Unlimited unlocks while active.</p>
          </button>

          <button
            onClick={() => buy('credits')}
            disabled={!!busy}
            className="rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50 disabled:opacity-60"
          >
            <p className="font-semibold text-slate-900">
              Pay as you go — $10 / 20 credits {busy === 'credits' && '· starting…'}
            </p>
            <p className="text-sm text-slate-600">1 credit per unlock or truck listing.</p>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl py-2 text-sm text-slate-500 hover:text-slate-700"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
