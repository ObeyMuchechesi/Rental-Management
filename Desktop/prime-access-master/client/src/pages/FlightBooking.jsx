import { useEffect, useState } from 'react';
import {
  Plane, PlaneTakeoff, PlaneLanding, Globe, CalendarDays, Wallet, Luggage,
  Users, CheckCircle2, ArrowRight, Send, Loader2, MessageCircle, Phone,
  Clock, ShieldCheck, Sparkles, Ticket,
} from 'lucide-react';
import { api, waLink, track } from '../api';
import { useSettings } from '../SettingsContext';
import SectionHeading from '../components/SectionHeading';
import CTASection from '../components/CTASection';

const ASSISTANCE = [
  { icon: Plane, title: 'International & regional flight bookings', text: 'Seats on the routes that suit your plans, whether you are travelling near or far.' },
  { icon: Globe, title: 'Flights to and from the UK, Europe, China, Australia & more', text: 'We cover the corridors our clients travel most, plus other destinations on request.' },
  { icon: CalendarDays, title: 'Help selecting travel dates & schedules', text: 'We compare schedules so your flights line up with your visa timeline and plans.' },
  { icon: Wallet, title: 'Convenient, competitive fares', text: 'Options matched to your budget - clear pricing, no pressure, no hidden surprises.' },
  { icon: Luggage, title: 'Travel planning after visa approval', text: 'Once your visa is approved, we help you plan the rest of the journey with confidence.' },
];

const TRIP_TYPES = ['Return trip', 'One-way trip'];
const CABINS = ['Economy', 'Premium economy', 'Business', 'First class'];

const DEFAULT_WA_MESSAGE =
  'Hi Prime Access, I would like help with flight booking for my upcoming travel.';

export default function FlightBooking() {
  const { settings } = useSettings();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    tripType: 'Return trip',
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    passengers: '1',
    cabin: 'Economy',
    budget: '',
    notes: '',
    website: '', // honeypot
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    api('/services', { auth: false }).then((d) => setServices(d.items)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function buildWaMessage(f) {
    const lines = [
      'Hi Prime Access, I would like to request a flight booking. ✈️',
      '',
      `Name: ${f.name}`,
      `Phone / WhatsApp: ${f.phone}`,
    ];
    if (f.email) lines.push(`Email: ${f.email}`);
    lines.push(
      '',
      `Trip type: ${f.tripType}`,
      `From: ${f.from}`,
      `To: ${f.to}`,
      `Departure date: ${f.departDate}`,
    );
    if (f.tripType === 'Return trip') lines.push(`Return date: ${f.returnDate || 'Flexible'}`);
    lines.push(`Passengers: ${f.passengers}`, `Cabin class: ${f.cabin}`);
    if (f.budget) lines.push(`Budget: ${f.budget}`);
    if (f.notes) lines.push(`Notes: ${f.notes}`);
    lines.push('', 'Please send me suitable flight options. Thank you.');
    return lines.join('\n');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.phone.trim() || !form.from.trim() || !form.to.trim() || !form.departDate) {
      setError('Please fill in your name, phone number, departure, destination and departure date.');
      return;
    }
    if (form.tripType === 'Return trip' && form.returnDate && form.returnDate < form.departDate) {
      setError('The return date cannot be before the departure date.');
      return;
    }

    setSubmitting(true);
    const message = buildWaMessage(form);
    // WhatsApp handoff uses the number stored in the system settings.
    const whatsappUrl = waLink(settings?.whatsappNumber, message);

    // Also log the request so it lands in the admin dashboard + triggers the
    // instant team alert. WhatsApp handoff works even if this call fails.
    let reference = null;
    try {
      const data = await api('/inquiries', {
        method: 'POST',
        auth: false,
        body: {
          name: form.name,
          phone: form.phone,
          email: form.email || 'notprovided@example.com',
          destination: form.to,
          service: 'Flight Booking',
          message,
          source: 'flight_booking_form',
          website: form.website,
        },
      });
      reference = data.reference || null;
    } catch {
      /* non-fatal - the visitor is still handed over to WhatsApp below */
    }

    track('flight_booking_requested', { trip: form.tripType, cabin: form.cabin });
    setResult({ whatsappUrl, reference });
    setSubmitting(false);
  }

  // Auto-open the pre-filled WhatsApp chat shortly after a successful request.
  useEffect(() => {
    if (!result?.whatsappUrl) return;
    const t = setTimeout(() => {
      window.location.href = result.whatsappUrl;
    }, 1500);
    return () => clearTimeout(t);
  }, [result]);

  if (!settings) return null;

  const today = new Date().toISOString().slice(0, 10);
  const waHref = waLink(settings.whatsappNumber, DEFAULT_WA_MESSAGE);
  const phoneHref = `tel:${settings.phone.replace(/[^0-9+]/g, '')}`;

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-brand-950 py-16 lg:py-20">
        <img
          src="https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Bright_skies_seen_from_a_plane_%28Unsplash%29.jpg/1920px-Bright_skies_seen_from_a_plane_%28Unsplash%29.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-brand-950/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/75 to-brand-950/30" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-950 to-transparent" />
        <div className="container-x relative text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold-300">
            <Sparkles size={13} /> ✈️ Flight Booking Services
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">
            Book Your Flight with Prime Access
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-brand-200">
            At Prime Access Immigration Consultancy, we make your international travel journey easier - from visa
            application to departure.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-brand-300">
            We also offer flight booking assistance, helping clients find suitable flight options based on their
            destination, preferred travel dates, and budget.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a href="#book" onClick={() => track('flight_booking_cta', { source: 'flight_hero' })} className="btn-gold !px-6 !py-3.5 text-base">
              <Ticket size={18} /> Request a Flight Quote
            </a>
            <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { source: 'flight_hero' })} className="btn-whatsapp !px-6 !py-3.5 text-base">
              <MessageCircle size={18} /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* ===== WHAT'S INCLUDED ===== */}
      <section className="py-14 sm:py-20">
        <div className="container-x">
          <SectionHeading
            eyebrow="What's Included"
            title="Our Flight Booking Assistance Includes"
            subtitle="Five ways we take the stress out of finding the right flight - before, during and after your visa application."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ASSISTANCE.map((a) => (
              <div key={a.title} className="flex flex-col rounded-2xl border border-brand-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-950 text-gold-400">
                  <a.icon size={21} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-brand-950">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-700">{a.text}</p>
              </div>
            ))}
            <div className="flex flex-col justify-between rounded-2xl bg-brand-950 p-6 text-white">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500 text-brand-950">
                  <MessageCircle size={21} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">Prefer to ask first?</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-300">
                  Message us on WhatsApp with your destination and dates - we will reply with suitable options.
                </p>
              </div>
              <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { source: 'flight_included' })} className="btn-whatsapp mt-5 w-full">
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BOOKING SYSTEM ===== */}
      <section id="book" className="bg-brand-50/60 py-14 sm:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-600">Flight Request</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-brand-950 sm:text-3xl">
              Tell us where you are flying
            </h2>
            <p className="mt-2 text-sm text-brand-700">
              Fill in your trip details below. On submit we save your request and open WhatsApp with everything
              pre-filled - just press send and our team will respond with suitable flight options.
            </p>

            {result ? (
              <div className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-6 text-center sm:p-8">
                <CheckCircle2 size={44} className="mx-auto text-green-600" />
                <h3 className="mt-3 font-display text-xl font-semibold text-brand-950">Flight Request Received!</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-brand-800">
                  Thank you, {form.name}. Your flight request has been captured{result.reference ? ` (Ref: ${result.reference})` : ''}.
                </p>
                <p className="mt-3 text-sm font-semibold text-green-700">
                  Opening WhatsApp so you can send us your request instantly...
                </p>
                <p className="mt-1 text-xs text-brand-600">
                  Flights are subject to airline availability and applicable fares.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { source: 'flight_booking_success' })} className="btn-whatsapp">
                    <MessageCircle size={16} /> Continue on WhatsApp
                  </a>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      setResult(null);
                      setForm((f) => ({ ...f, from: '', to: '', departDate: '', returnDate: '', notes: '' }));
                    }}
                  >
                    Book another flight
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
                <input type="text" name="website" value={form.website} onChange={set('website')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="fb-name">Full Name *</label>
                    <input id="fb-name" className="input" value={form.name} onChange={set('name')} placeholder="e.g. Tendai Moyo" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="fb-phone">Phone / WhatsApp *</label>
                    <input id="fb-phone" className="input" value={form.phone} onChange={set('phone')} placeholder="e.g. +263772401643" required />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="fb-email">Email Address</label>
                    <input id="fb-email" type="email" className="input" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="label" htmlFor="fb-trip">Trip Type *</label>
                    <select id="fb-trip" className="input" value={form.tripType} onChange={set('tripType')}>
                      {TRIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="fb-from">Flying From *</label>
                    <input id="fb-from" className="input" value={form.from} onChange={set('from')} placeholder="e.g. Harare (HRE)" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="fb-to">Flying To *</label>
                    <input id="fb-to" className="input" value={form.to} onChange={set('to')} placeholder="e.g. London (LHR)" required />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="fb-depart">Departure Date *</label>
                    <input id="fb-depart" type="date" min={today} className="input" value={form.departDate} onChange={set('departDate')} required />
                  </div>
                  <div>
                    <label className="label" htmlFor="fb-return">Return Date</label>
                    <input
                      id="fb-return"
                      type="date"
                      min={form.departDate || today}
                      className="input"
                      value={form.returnDate}
                      onChange={set('returnDate')}
                      disabled={form.tripType !== 'Return trip'}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="fb-pax">Passengers</label>
                    <select id="fb-pax" className="input" value={form.passengers} onChange={set('passengers')}>
                      {['1', '2', '3', '4', '5', '6', '7+'].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="fb-cabin">Cabin Class</label>
                    <select id="fb-cabin" className="input" value={form.cabin} onChange={set('cabin')}>
                      {CABINS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="fb-budget">Budget (optional)</label>
                  <input id="fb-budget" className="input" value={form.budget} onChange={set('budget')} placeholder="e.g. USD 800 - 1200 per person" />
                </div>

                <div>
                  <label className="label" htmlFor="fb-notes">Notes (optional)</label>
                  <textarea id="fb-notes" className="input min-h-[100px] resize-y" value={form.notes} onChange={set('notes')} placeholder="Flexible dates, baggage needs, connecting cities, visa status..." />
                </div>

                {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

                <button type="submit" disabled={submitting} className="btn-gold w-full !py-3.5 text-base">
                  {submitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Sending...</>
                  ) : (
                    <><Send size={18} /> Send Flight Request on WhatsApp</>
                  )}
                </button>
                <p className="text-center text-xs text-brand-500">
                  Your request opens in WhatsApp with the details pre-filled - just press send.
                </p>
              </form>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-brand-950 p-6 text-white">
              <h3 className="font-display text-lg font-semibold">How it works</h3>
              <ol className="mt-4 space-y-4">
                {[
                  { n: '01', t: 'Send your trip details', d: 'Fill in the form - it takes under a minute.' },
                  { n: '02', t: 'We search your options', d: 'Our team checks schedules and fares for your route and dates.' },
                  { n: '03', t: 'Receive options on WhatsApp', d: 'We reply with suitable choices matched to your budget.' },
                  { n: '04', t: 'Confirm & travel', d: 'Pick your flight and we help you finalise the rest of your journey.' },
                ].map((s) => (
                  <li key={s.n} className="flex gap-3">
                    <span className="font-display text-lg font-extrabold text-gold-400">{s.n}</span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{s.t}</span>
                      <span className="block text-xs text-brand-300">{s.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold text-brand-950">Talk to us now</h3>
              <p className="mt-1.5 text-sm text-brand-700">Quick question about a route or fare? Message us directly.</p>
              <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { source: 'flight_sidebar' })} className="btn-whatsapp mt-4 w-full">
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
              <a href={phoneHref} onClick={() => track('call_click', { source: 'flight_sidebar' })} className="btn-outline mt-2.5 w-full">
                <Phone size={16} /> Call {settings.phoneDisplay || settings.phone}
              </a>
              <ul className="mt-5 space-y-3 border-t border-brand-100 pt-4">
                {[
                  { icon: Clock, t: 'Fast replies during business hours' },
                  { icon: ShieldCheck, t: 'Honest advice - no false promises' },
                  { icon: Users, t: 'One partner for visa + flights' },
                ].map((p) => (
                  <li key={p.t} className="flex gap-2.5 text-sm text-brand-800">
                    <p.icon size={17} className="mt-0.5 shrink-0 text-gold-600" /> {p.t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold text-brand-950">Reach us</h3>
              <ul className="mt-4 space-y-3 text-sm text-brand-800">
                <li className="flex items-start gap-2.5"><Phone size={16} className="mt-0.5 shrink-0 text-gold-600" /> <a href={phoneHref} className="hover:text-brand-950">{settings.phoneDisplay || settings.phone}</a></li>
                <li className="flex items-start gap-2.5"><PlaneTakeoff size={16} className="mt-0.5 shrink-0 text-gold-600" /> Departures from Harare to the world</li>
                <li className="flex items-start gap-2.5"><PlaneLanding size={16} className="mt-0.5 shrink-0 text-gold-600" /> Return legs to the UK, Europe, China, Australia & more</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* ===== ONE JOURNEY BAND ===== */}
      <section className="bg-brand-950 py-14 sm:py-20">
        <div className="container-x text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 text-brand-950">
            <Plane size={26} />
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold text-white sm:text-4xl">
            One Journey. One Trusted Partner.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-brand-200">
            From visa assistance to flight bookings, Prime Access is here to help you prepare for your journey with
            confidence.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a href="#book" className="btn-gold"><Ticket size={17} /> Request a Flight Quote</a>
            <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { source: 'flight_band' })} className="btn-whatsapp">
              <MessageCircle size={17} /> WhatsApp Us
            </a>
          </div>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-brand-400">
            <span className="flex items-center gap-1.5"><Globe size={13} className="text-gold-400" /> UK · Europe · China · Australia · Worldwide</span>
          </div>
        </div>
      </section>

      {/* ===== DISCLAIMER ===== */}
      <section className="bg-white py-10 sm:py-12">
        <div className="container-x">
          <div className="mx-auto max-w-3xl rounded-2xl border border-brand-100 bg-brand-50/60 p-6 text-center">
            <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
              <ShieldCheck size={15} className="text-gold-600" /> Please Note
            </p>
            <p className="mt-3 text-sm leading-relaxed text-brand-700">
              Flight bookings are subject to airline availability and applicable fares. Visa approval is not guaranteed
              by Prime Access, and flight arrangements should be made with consideration of your visa status.
            </p>
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to Book Your Flight?"
        subtitle="Send us your route, dates and budget - we will come back to you with suitable options on WhatsApp."
      />
    </>
  );
}
