import { useEffect, useState } from 'react';
import { Send, CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';
import { api, track } from '../api';

export default function InquiryForm({ services = [], defaultService = '', compact = false }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    destination: '',
    service: defaultService,
    message: '',
    website: '', // honeypot
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // After a successful submission, open the pre-filled WhatsApp chat with the
  // visitor's details automatically so they can send the message instantly.
  useEffect(() => {
    if (!result || !result.whatsappUrl) return;
    const t = setTimeout(() => {
      window.location.href = result.whatsappUrl;
    }, 1500);
    return () => clearTimeout(t);
  }, [result]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api('/inquiries', { method: 'POST', body: form, auth: false });
      track('inquiry_submitted', { service: form.service });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center sm:p-8">
        <CheckCircle2 size={44} className="mx-auto text-green-600" />
        <h3 className="mt-3 font-display text-xl font-semibold text-brand-950">Inquiry Received!</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-brand-800">{result.confirmation}</p>
        <p className="mt-1 text-xs font-semibold text-brand-500">Reference: {result.reference}</p>
        <p className="mt-3 text-sm font-semibold text-green-700">
          Opening WhatsApp so you can send us your message instantly...
        </p>
        <p className="mt-1 text-xs text-brand-600">
          Our team will respond shortly during business hours. For an instant reply, message us on WhatsApp now.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            <MessageCircle size={16} /> Continue on WhatsApp
          </a>
          <button className="btn-outline" onClick={() => { setResult(null); setForm((f) => ({ ...f, message: '' })); }}>
            Send another inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="text" name="website" value={form.website} onChange={set('website')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className={compact ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4 sm:grid-cols-2'}>
        <div>
          <label className="label" htmlFor="inq-name">Full Name *</label>
          <input id="inq-name" className="input" value={form.name} onChange={set('name')} placeholder="e.g. Tendai Moyo" required />
        </div>
        <div>
          <label className="label" htmlFor="inq-phone">Phone / WhatsApp *</label>
          <input id="inq-phone" className="input" value={form.phone} onChange={set('phone')} placeholder="e.g. +263772401643" required />
        </div>
      </div>

      <div className={compact ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4 sm:grid-cols-2'}>
        <div>
          <label className="label" htmlFor="inq-email">Email Address *</label>
          <input id="inq-email" type="email" className="input" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
        </div>
        <div>
          <label className="label" htmlFor="inq-dest">Destination Country</label>
          <input id="inq-dest" className="input" value={form.destination} onChange={set('destination')} placeholder="e.g. United Kingdom" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="inq-service">Service Required *</label>
        <select id="inq-service" className="input" value={form.service} onChange={set('service')} required>
          <option value="">Select a service...</option>
          {services.map((s) => (
            <option key={s._id} value={s.title}>{s.title}</option>
          ))}
          <option value="Flight Booking">Flight Booking (flights &amp; travel)</option>
          <option value="Other">Other / Not sure yet</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="inq-msg">How can we help?</label>
        <textarea id="inq-msg" className="input min-h-[110px] resize-y" value={form.message} onChange={set('message')} placeholder="Tell us about your plans - destination, timeline, current situation..." />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-gold w-full !py-3.5 text-base">
        {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <><Send size={18} /> Submit Inquiry</>}
      </button>
      <p className="text-center text-xs text-brand-500">
        24/7 online submission · Your details are handled securely and never shared.
      </p>
    </form>
  );
}