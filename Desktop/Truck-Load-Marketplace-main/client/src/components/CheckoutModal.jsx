import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { money } from '../lib/format';
import { Notice } from './ui';

const PLAN_OPTIONS = [
  {
    id: 'credits',
    name: 'Pay as you go',
    price: 10,
    hint: '20 credits · 1 per unlock or truck listing',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 29,
    hint: 'Unlimited unlocks and listings for 30 days',
  },
];

const METHODS = [
  { id: 'ecocash', name: 'EcoCash', hint: 'PIN prompt on your phone' },
  { id: 'onemoney', name: 'OneMoney', hint: 'PIN prompt on your phone' },
  { id: 'card', name: 'Card', hint: 'Secure PayNow page' },
];

const methodName = (id) => METHODS.find((item) => item.id === id)?.name || 'mobile money';

const normalizePhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('263')) digits = `0${digits.slice(3)}`;
  return digits;
};

export default function CheckoutModal({
  open,
  onClose,
  presetPlan = 'credits',
  title = 'Pay for TruckLink',
  message = '',
  closeLabel = 'Not now',
  onPaid,
}) {
  const { user, refresh, refreshSubscription } = useAuth();
  const [plan, setPlan] = useState(presetPlan);
  const [method, setMethod] = useState('ecocash');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('form');
  const [reference, setReference] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const timerRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopPolling();
      setStep('form');
      setBusy(false);
      setError('');
      setNote('');
      setReference(null);
      setInstructions('');
      setResult(null);
      return;
    }
    setPlan(presetPlan);
    setError('');
    setNote('');
  }, [open, presetPlan, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  const selectedPlan = PLAN_OPTIONS.find((option) => option.id === plan) || PLAN_OPTIONS[0];
  const mobile = method !== 'card';

  const checkOnce = useCallback(
    async (paymentReference) => {
      const { data } = await api.get(`/plans/payments/${paymentReference}/status`);
      if (data.payment.status === 'paid') {
        stopPolling();
        setResult(data.payment);
        setStep('done');
        setError('');
        await Promise.all([refresh(), refreshSubscription()]);
        onPaid?.(data.payment);
        return true;
      }
      if (data.payment.status === 'failed' || data.payment.status === 'cancelled') {
        stopPolling();
        setStep('form');
        const friendly =
          data.payment.status === 'cancelled'
            ? 'That payment was cancelled. Nothing was charged.'
            : 'PayNow could not complete that payment. You can try again.';
        const detail =
          data.payment.notes && !/^PayNow (status|result):/i.test(data.payment.notes)
            ? ` ${data.payment.notes}`
            : '';
        setError(`${friendly}${detail}`);
        return true;
      }
      return false;
    },
    [onPaid, refresh, refreshSubscription, stopPolling]
  );

  const poll = useCallback(
    (paymentReference, attempt = 0) => {
      timerRef.current = null;
      checkOnce(paymentReference)
        .then((finished) => {
          if (finished) return;
          if (attempt >= 39) {
            setNote('No approval yet. Approve the prompt on your phone, then tap “Check status”.');
            return;
          }
          timerRef.current = setTimeout(() => poll(paymentReference, attempt + 1), 3000);
        })
        .catch(() => {
          if (attempt >= 39) {
            setNote('Could not reach the server. Check your payment history in a moment.');
            return;
          }
          timerRef.current = setTimeout(() => poll(paymentReference, attempt + 1), 4000);
        });
    },
    [checkOnce]
  );

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNote('');

    const normalized = normalizePhone(phone);
    if (mobile && !/^07\d{8}$/.test(normalized)) {
      setError('Enter the mobile number that will receive the payment prompt, e.g. 0771234567.');
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post(plan === 'monthly' ? '/plans/subscribe' : '/plans/credits', {
        method,
        phone: mobile ? normalized : undefined,
      });

      if (data.mode === 'mobile') {
        setReference(data.reference);
        setInstructions(data.instructions || '');
        setStep('waiting');
        setBusy(false);
        poll(data.reference, 0);
        return;
      }

      const target = data.redirectUrl || data.url;
      if (!target) throw new Error(data.message || 'PayNow did not return a checkout link.');
      window.location.href = target;
    } catch (err) {
      setError(errorMessage(err, 'Could not start the payment.'));
      setBusy(false);
    }
  };

  const checkNow = async () => {
    if (!reference) return;
    setNote('');
    try {
      const finished = await checkOnce(reference);
      if (!finished) setNote('PayNow has not confirmed the approval yet. Give it a few seconds.');
    } catch {
      setNote('Could not reach the server. Try again in a moment.');
    }
  };

  const cancelWaiting = () => {
    stopPolling();
    setStep('form');
    setNote('The payment is still pending. You can approve it on your phone or finish it later from payment history.');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
      >
        {step !== 'done' && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              {message && <p className="mt-1 text-sm text-slate-600">{message}</p>}
              <p className="mt-1 text-xs text-slate-500">
                Charged in USD via PayNow Zimbabwe · activates automatically
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close checkout"
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={submit} className="mt-5 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {PLAN_OPTIONS.map((option) => {
                const selected = plan === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPlan(option.id)}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/60'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{option.name}</span>
                      <span className={`h-4 w-4 rounded-full border-2 ${selected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`} />
                    </span>
                    <span className="mt-1 block text-xl font-bold text-slate-900">{money(option.price)}</span>
                    <span className="mt-1 block text-xs text-slate-500">{option.hint}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">Payment method</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {METHODS.map((option) => {
                  const selected = method === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setMethod(option.id)}
                      className={`rounded-xl border px-2 py-3 text-center text-sm transition ${
                        selected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block font-semibold">{option.name}</span>
                      <span className="mt-0.5 block text-[11px] leading-tight text-slate-500">{option.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {mobile ? (
              <div>
                <label htmlFor="checkout-phone" className="text-sm font-semibold text-slate-800">
                  {methodName(method)} number
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0771234567"
                  className="input mt-1 w-full"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  We send the payment prompt to this number. Enter your PIN on the phone to approve — you stay
                  on this page.
                </p>
              </div>
            ) : (
              <Notice tone="info">
                Card details are entered on PayNow's secure page. You will come back here automatically once
                the payment is confirmed.
              </Notice>
            )}

            {user?.email && (
              <p className="text-xs text-slate-500">
                PayNow sends the receipt to <span className="font-medium text-slate-700">{user.email}</span>.
              </p>
            )}

            {error && <Notice tone="error">{error}</Notice>}
            {note && <Notice tone="info">{note}</Notice>}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy
                ? 'Starting payment…'
                : mobile
                  ? `Pay ${money(selectedPlan.price)} with ${methodName(method)}`
                  : `Continue to PayNow · ${money(selectedPlan.price)}`}
            </button>

            <button type="button" onClick={onClose} className="w-full py-1 text-sm text-slate-500 hover:text-slate-700">
              {closeLabel}
            </button>
          </form>
        )}

        {step === 'waiting' && (
          <div className="mt-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-indigo-50">
              <span className="h-6 w-6 animate-pulse rounded-full bg-indigo-600" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Approve on your phone</h3>
            <p className="mt-2 text-sm text-slate-600">
              {instructions ||
                `A ${methodName(method)} prompt was sent to ${phone}. Enter your PIN to pay ${money(selectedPlan.price)}.`}
            </p>
            <p className="mt-4 text-3xl font-bold text-slate-900">{money(selectedPlan.price)}</p>
            <p className="text-xs text-slate-500">{selectedPlan.name} · {selectedPlan.hint}</p>

            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-indigo-700">
              <span className="h-2 w-2 animate-ping rounded-full bg-indigo-500" />
              Waiting for confirmation…
            </div>

            {error && <div className="mt-4"><Notice tone="error">{error}</Notice></div>}
            {note && <div className="mt-4"><Notice tone="info">{note}</Notice></div>}

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={checkNow} className="btn-primary">
                Check status
              </button>
              <button type="button" onClick={cancelWaiting} className="btn-ghost">
                Back
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Approved already? This screen updates on its own — keep it open for a moment.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
              ✓
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Payment confirmed</h2>
            <p className="mt-2 text-sm text-slate-600">
              {result?.plan === 'monthly'
                ? 'Your monthly plan is active — unlimited unlocks and truck listings.'
                : `${result?.credits || 0} credits have been added to your account.`}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {money(result?.amount ?? selectedPlan.price)} · {result?.reference}
            </p>
            <button type="button" onClick={onClose} className="btn-primary mt-6 w-full">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
