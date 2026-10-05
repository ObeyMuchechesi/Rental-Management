import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Phone, FileText, CalendarCheck, ShieldCheck, Clock, Award, Users,
  Star, MapPin, ArrowRight, Sparkles, Plane, Ticket,
} from 'lucide-react';
import { api, waLink, track, WHATSAPP_MESSAGE } from '../api';
import { useSettings } from '../SettingsContext';
import ServiceCard from '../components/ServiceCard';
import VideoBlock from '../components/VideoBlock';
import InquiryForm from '../components/InquiryForm';
import SectionHeading from '../components/SectionHeading';
import CTASection from '../components/CTASection';
import womanImg from '../assets/woman-passport.jpg';
import collageImg from '../assets/collage-prime.jpg';

const JOURNEY_STEPS = [
  { step: '01', title: 'Visit', text: 'You explore our services and find what you need.' },
  { step: '02', title: 'Select Service', text: 'Choose the visa or immigration service that fits your goal.' },
  { step: '03', title: 'Make an Inquiry', text: 'Send your details through the form - it takes under a minute.' },
  { step: '04', title: 'Instant Alert', text: 'Our team is notified on WhatsApp the moment you submit.' },
  { step: '05', title: 'We Respond', text: 'We reply fast - usually within business hours, often sooner.' },
  { step: '06', title: 'Consultation', text: 'Meet with our consultants and start your journey.' },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, label: 'Secure & Confidential' },
  { icon: Clock, label: 'Fast Response Times' },
  { icon: Award, label: 'Expert Guidance' },
];

const FEATURES = [
  { icon: Users, title: 'Personal, Human Guidance', text: 'Real consultants who understand your situation and answer your questions honestly.' },
  { icon: MessageCircle, title: 'WhatsApp-First Communication', text: 'The moment you enquire, we are alerted on WhatsApp so you are never left waiting.' },
  { icon: ShieldCheck, title: 'Secure & Confidential', text: 'Your personal information is handled securely and never shared with third parties.' },
  { icon: Award, title: 'Transparent, No Hidden Fees', text: 'Clear advice on eligibility and requirements before you commit to anything.' },
];

export default function Home() {
  const { settings } = useSettings();
  const [services, setServices] = useState([]);

  useEffect(() => {
    api('/services', { auth: false }).then((d) => setServices(d.items)).catch(() => {});
  }, []);

  if (!settings) return null;

  const phoneHref = `tel:${settings.phone.replace(/[^0-9+]/g, '')}`;
  const waHref = waLink(settings.whatsappNumber, WHATSAPP_MESSAGE);
  const publishedVideos = (settings.videos || []).filter((v) => v.published);

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-brand-950">
        {/* Full-bleed photo covering the whole hero, darker on the left so the copy stays readable */}
        <img
          src={womanImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[50%_22%] sm:object-[58%_16%]"
        />
        <div className="absolute inset-0 bg-brand-950/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/80 to-brand-950/15 lg:via-brand-950/60" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-brand-950/95 via-brand-950/45 to-transparent" />
        <div className="container-x relative pb-10 pt-14 sm:pb-12 sm:pt-20 lg:pt-28">
          <div className="grid items-center gap-9 sm:gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="animate-fade-up">
              <p className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold-300">
                <Sparkles size={13} /> Trusted Immigration Consultancy Firm
              </p>
              <h1 className="mt-4 font-display text-[2.1rem] font-bold leading-tight text-white sm:mt-5 sm:text-5xl lg:text-[3.4rem]">
                {settings.heroTitle}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-200 sm:mt-5 sm:text-lg">{settings.heroSubtitle}</p>

              <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3">
                <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { source: 'hero' })} className="btn-whatsapp !px-6 !py-3.5 text-base">
                  <MessageCircle size={18} /> WhatsApp Us
                </a>
                <a href={phoneHref} onClick={() => track('call_click', { source: 'hero' })} className="btn-light !px-6 !py-3.5 text-base">
                  <Phone size={18} /> Call Now
                </a>
                <Link to="/contact" className="btn !border !border-white/25 !bg-transparent !px-6 !py-3.5 !text-base !text-white hover:!bg-white/10">
                  <FileText size={18} /> Make an Inquiry
                </Link>
              </div>
            </div>

            {/* Hero right: quick contact / hours panel */}
            <div className="animate-fade-up rounded-3xl border border-white/10 bg-brand-950/60 p-5 shadow-soft backdrop-blur-lg sm:p-6 lg:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4 sm:pb-5">
                <div>
                  <h3 className="font-display text-lg font-semibold text-white sm:text-xl">Quick Support</h3>
                  <p className="mt-0.5 text-xs text-brand-300">We reply fast - inquiries accepted 24/7</p>
                </div>
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                </span>
              </div>

              <ul className="mt-3 space-y-2 sm:mt-5 sm:space-y-3">
                <li>
                  <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { source: 'quick_support' })} className="flex items-center gap-3 rounded-xl bg-[#25D366]/10 p-2.5 transition hover:bg-[#25D366]/20 sm:p-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white sm:h-10 sm:w-10"><MessageCircle size={18} /></span>
                    <span><span className="block text-sm font-semibold text-white">WhatsApp Us</span><span className="block text-xs text-brand-300">Chat instantly - no waiting</span></span>
                  </a>
                </li>
                <li>
                  <a href={phoneHref} onClick={() => track('call_click', { source: 'quick_support' })} className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 transition hover:bg-white/10 sm:p-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-950 sm:h-10 sm:w-10"><Phone size={18} /></span>
                    <span><span className="block text-sm font-semibold text-white">Call Now</span><span className="block text-xs text-brand-300">{settings.phoneDisplay || settings.phone}</span></span>
                  </a>
                </li>
                <li>
                  <Link to="/contact" className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 transition hover:bg-white/10 sm:p-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500/20 text-gold-300 sm:h-10 sm:w-10"><FileText size={18} /></span>
                    <span><span className="block text-sm font-semibold text-white">Make an Inquiry</span><span className="block text-xs text-brand-300">Submit online 24/7</span></span>
                  </Link>
                </li>
              </ul>

              <div className="mt-3.5 rounded-xl bg-white/5 p-3 sm:mt-4 sm:p-4">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gold-400 sm:text-xs"><Clock size={13} /> Business Hours</p>
                <ul className="mt-2.5 space-y-1 text-xs text-brand-200 sm:mt-3 sm:space-y-1.5">
                  {settings.businessHours?.map((h) => (
                    <li key={h.day} className="flex items-center justify-between gap-3">
                      <span>{h.day}</span>
                      {h.hours.toLowerCase() === 'closed' ? (
                        <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300">Closed</span>
                      ) : (
                        <span className="text-white">{h.hours}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-brand-400">Online inquiries accepted 24/7 - WhatsApp answered on weekends</p>
              </div>
            </div>
          </div>

          {/* Three feature cards along the hero bottom (reference layout) - compact 3-across on mobile like desktop */}
          <div className="relative mt-6 grid grid-cols-3 gap-2 sm:mt-12 sm:gap-4">
            {TRUST_POINTS.map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-1.5 py-3.5 text-center backdrop-blur sm:flex-row sm:gap-4 sm:p-5 sm:text-left">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-300 sm:h-12 sm:w-12"><b.icon size={18} /></span>
                <span className="font-display text-[10px] font-bold leading-tight text-white sm:text-base">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY US / INTRO SPLIT (reference "bespoke" split layout) ===== */}
      <section className="py-14 sm:py-20 lg:py-24">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Why Prime Access"
              title="A Consultancy That Puts You First"
              subtitle={settings.aboutIntro}
            />
            <div className="mt-6 grid gap-3 min-[380px]:grid-cols-2 sm:mt-8 sm:gap-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card sm:p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-950 text-gold-300 sm:h-11 sm:w-11"><f.icon size={20} /></span>
                  <h4 className="mt-2.5 font-semibold text-brand-950 sm:mt-3">{f.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-brand-700 sm:mt-1.5">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
              <h3 className="font-display text-2xl font-semibold text-brand-950">Make an Inquiry</h3>
              <p className="mt-1 text-sm text-brand-700">Fill in the form and we will respond quickly - often within the hour during business time.</p>
              <div className="mt-6"><InquiryForm services={services} /></div>
            </div>
            <div className="rounded-[2rem] bg-brand-950 p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-300">Need Help?</p>
                  <p className="mt-2 flex items-center gap-3 font-display text-2xl font-extrabold text-white">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-950"><Phone size={19} /></span>
                    <a href={phoneHref} onClick={() => track('call_click', { source: 'need_help' })}>{settings.phoneDisplay || settings.phone}</a>
                  </p>
                  <p className="mt-1 text-sm text-brand-300">Online inquiries accepted 24/7</p>
                </div>
                <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { source: 'need_help' })} className="btn-whatsapp !px-5 !py-2.5 text-xs">
                  <MessageCircle size={15} /> WhatsApp Us
                </a>
              </div>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-brand-100 shadow-soft">
              <img
                src={collageImg}
                alt="Prime Access at work - consultations, applications and successful routes"
                loading="lazy"
                className="w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </section>

      <CTASection />

      {/* ===== DESTINATIONS (reference-style photo cards) ===== */}
      {(() => {
        const dest = [
          { slug: 'uk-visa-immigration', label: 'United Kingdom' },
          { slug: 'schengen-assistance', label: 'Schengen Europe' },
        ]
          .map((d) => ({ ...d, service: services.find((s) => s.slug === d.slug) }))
          .filter((d) => d.service && d.service.image);
        if (dest.length === 0) return null;
        return (
          <section className="bg-white py-14 sm:py-20 lg:py-24">
            <div className="container-x">
              <SectionHeading
                eyebrow="Choose Your Destination"
                title="Popular Routes We Support"
                subtitle="Explore the journeys behind our most requested services - tap a destination to see what it involves."
              />
          <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2 md:gap-6">
            {dest.map(({ label, service }) => (
              <Link
                key={service.slug}
                to={`/services/${service.slug}`}
                onClick={() => track('service_view', { service: service.title, source: 'destination_card' })}
                className="group relative flex h-72 flex-col justify-end overflow-hidden rounded-[2rem] shadow-soft transition hover:-translate-y-1 hover:shadow-soft sm:h-80"
              >
                    <img
                      src={service.image}
                      alt={label}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/25 to-transparent" />
                    <div className="relative p-7 sm:p-9">
                      <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur">
                        Popular Destination
                      </p>
                      <h3 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">{label}</h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">{service.shortDescription}</p>
                      <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-950 transition group-hover:bg-gold-500">
                        View {service.title} <ArrowRight size={15} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ===== SERVICES PREVIEW ===== */}
      <section className="bg-brand-50/60 py-14 sm:py-20">
        <div className="container-x">
          <SectionHeading
            eyebrow="Our Services"
            title="Immigration Services Built Around Your Goals"
            subtitle="From UK visas to university placement and Schengen assistance - expert support at every step."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((s) => <ServiceCard key={s._id} service={s} />)}
          </div>
          <div className="mt-10 text-center">
            <Link to="/services" className="btn-primary"><CalendarCheck size={17} /> View All Services <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* ===== FLIGHT BOOKING PROMO ===== */}
      <section className="relative overflow-hidden bg-brand-950 py-14 sm:py-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-brand-800/60" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full border border-brand-800/40" />
        <div className="container-x relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold-300">
              <Plane size={13} /> ✈️ Flight Booking Services
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-white sm:text-4xl">
              From Visa Application to Departure
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-200 sm:text-base">
              We help clients find suitable flight options based on their destination, preferred travel dates and
              budget - international &amp; regional bookings to the UK, Europe, China, Australia and beyond.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {['International & regional flights', 'UK · Europe · China · Australia', 'Dates & schedules help', 'Competitive fares', 'Post-visa travel planning'].map((t) => (
                <li key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-brand-100">
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-5 font-display text-lg font-semibold text-gold-300">One Journey. One Trusted Partner.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link to="/flight-booking" onClick={() => track('flight_booking_cta', { source: 'home_promo' })} className="btn-gold !px-6 !py-3.5 text-base">
              <Ticket size={18} /> Book a Flight <ArrowRight size={16} />
            </Link>
            <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { source: 'home_flight_promo' })} className="btn-whatsapp !px-6 !py-3.5 text-base">
              <MessageCircle size={18} /> Ask on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ===== CLIENT JOURNEY ===== */}
      <section className="py-14 sm:py-20">
        <div className="container-x">
          <SectionHeading
            eyebrow="How It Works"
            title="Your Journey with Prime Access"
            subtitle="A simple, fast and transparent process - from first visit to consultation."
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {JOURNEY_STEPS.map((s, i) => (
              <div key={s.step} className="relative rounded-2xl border border-brand-100 bg-white p-4 shadow-card sm:p-6">
                    <span className="font-display text-3xl font-extrabold text-gold-300 sm:text-4xl">{s.step}</span>
                <h3 className="mt-1.5 font-display text-base font-semibold text-brand-950 sm:mt-2 sm:text-lg">{s.title}</h3>
                <p className="mt-1 text-sm text-brand-700 sm:mt-1.5">{s.text}</p>
                {i < JOURNEY_STEPS.length - 1 && (
                  <ArrowRight size={18} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-gold-500 lg:block" />
                )}
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border-2 border-brand-900 bg-brand-50/60 p-6 text-center sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-900">Primary Client Journey</p>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-display text-sm font-bold text-brand-900 sm:text-base">
              VISITOR <ArrowRight size={15} className="text-gold-600" /> SELECTS SERVICE <ArrowRight size={15} className="text-gold-600" /> MAKES INQUIRY <ArrowRight size={15} className="text-gold-600" /> WHATSAPP ALERT <ArrowRight size={15} className="text-gold-600" /> PRIME ACCESS RESPONDS <ArrowRight size={15} className="text-gold-600" /> CONSULTATION
            </p>
          </div>
        </div>
      </section>

      {/* ===== VIDEOS ===== */}
      {publishedVideos.length > 0 && (
        <section className="bg-brand-50/60 py-14 sm:py-20">
          <div className="container-x">
            <SectionHeading eyebrow="Watch & Learn" title="Immigration Tips & Updates" subtitle="Educational videos and announcements from the Prime Access team." />
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {publishedVideos.map((v, i) => <VideoBlock key={i} video={v} />)}
            </div>
          </div>
        </section>
      )}

      {/* ===== TESTIMONIALS ===== */}
      {settings.testimonials?.length > 0 && (
        <section className="bg-brand-950 py-14 sm:py-20">
          <div className="container-x">
            <SectionHeading light eyebrow="Testimonials" title="What Our Clients Say" subtitle="Real experiences from people we have helped on their journey." />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {settings.testimonials.slice(0, 3).map((t, i) => (
                <figure key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="flex gap-1 text-gold-400">
                    {Array.from({ length: t.rating || 5 }).map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-brand-200">“{t.text}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 font-bold text-brand-950">
                      {t.name?.charAt(0) || 'C'}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{t.name}</span>
                      <span className="block text-xs text-brand-400">{t.location}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CONTACT STRIP ===== */}
      <section className="bg-brand-50/60 py-12 sm:py-16">
        <div className="container-x grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {[
            { icon: Phone, title: 'Call Us', line1: settings.phoneDisplay || settings.phone, line2: 'Mon - Sat, business hours', href: phoneHref, action: 'call_click' },
            { icon: MessageCircle, title: 'WhatsApp', line1: 'Chat instantly', line2: '24/7 messaging', href: waHref, action: 'whatsapp_click' },
            { icon: MapPin, title: 'Visit Us', line1: settings.address, line2: 'By appointment', href: null },
          ].map((c) => {
            const Inner = (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-950 text-gold-300 sm:h-11 sm:w-11"><c.icon size={20} /></span>
                <h4 className="mt-2 font-semibold text-brand-950 sm:mt-3">{c.title}</h4>
                <p className="mt-0.5 text-sm font-medium leading-snug text-brand-900 sm:mt-1">{c.line1}</p>
                <p className="text-xs text-brand-600">{c.line2}</p>
              </>
            );
            const cls = 'rounded-2xl border border-brand-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft sm:p-6';
            return c.href ? (
              <a key={c.title} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className={cls} onClick={() => c.action && track(c.action, { source: 'contact_strip' })}>{Inner}</a>
            ) : (
              <div key={c.title} className={cls}>{Inner}</div>
            );
          })}
        </div>
      </section>
    </>
  );
}