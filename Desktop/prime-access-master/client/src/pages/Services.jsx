import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Ticket, ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react';
import { api, waLink, track } from '../api';
import { useSettings } from '../SettingsContext';
import ServiceCard from '../components/ServiceCard';
import SectionHeading from '../components/SectionHeading';
import CTASection from '../components/CTASection';
import promoImg from '../assets/promo-london.jpg';
import InquiryForm from '../components/InquiryForm';

export default function Services() {
  const [services, setServices] = useState([]);
  const { settings } = useSettings();

  useEffect(() => {
    api('/services', { auth: false }).then((d) => setServices(d.items)).catch(() => {});
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-brand-950 py-16 lg:py-20">
        {/* Full-bleed photo backdrop, veiled so the copy stays readable */}
        <img
          src={promoImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-brand-950/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/75 to-brand-950/35" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-950 to-transparent" />
        <div className="container-x relative text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-400">Our Services</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">Visa & Immigration Services</h1>
          <p className="mx-auto mt-4 max-w-2xl text-brand-300">
            UK visas, visit and student visas, Schengen assistance, university placement and more - expert guidance for every step of your journey.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-x">
          {/* Featured: Flight Booking Services */}
          <div className="mb-8 overflow-hidden rounded-[2rem] border border-brand-100 bg-brand-950 shadow-soft">
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-300">
                  <Plane size={13} /> ✈️ New · Flight Booking Services
                </span>
                <h2 className="mt-4 font-display text-2xl font-semibold text-white sm:text-3xl">
                  Flights to match your visa, dates & budget
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-200">
                  International &amp; regional flight bookings to and from the UK, Europe, China, Australia and other
                  destinations - with help selecting travel dates, competitive fares and travel planning support after
                  your visa has been approved.
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    'International & regional bookings',
                    'UK, Europe, China, Australia & more',
                    'Help with dates & schedules',
                    'Competitive, convenient fares',
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-brand-100">
                      <CheckCircle2 size={16} className="shrink-0 text-gold-400" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3 lg:min-w-[230px]">
                <Link to="/flight-booking" onClick={() => track('flight_booking_cta', { source: 'services_featured' })} className="btn-gold">
                  <Ticket size={17} /> Book a Flight <ArrowRight size={15} />
                </Link>
                <a
                  href={waLink(settings?.whatsappNumber, 'Hi Prime Access, I would like help with flight booking for my upcoming travel. ✈️')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('whatsapp_click', { source: 'services_featured' })}
                  className="btn-whatsapp"
                >
                  <MessageCircle size={16} /> WhatsApp Us
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => <ServiceCard key={s._id} service={s} />)}
          </div>
        </div>
      </section>

      <section className="bg-brand-50/60 py-20">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Not Sure Where to Start?"
              title="Tell Us About Your Plans"
              subtitle="Choose a service below or describe your situation and our consultants will point you in the right direction - no obligation."
            />
            <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
              <InquiryForm services={services} />
            </div>
          </div>
          <div className="space-y-6">
            <SectionHeading
              align="left"
              eyebrow="Good to Know"
              title="Helpful Before You Apply"
            />
            <div className="grid gap-4">
              {[
                { t: 'Check eligibility first', d: 'Not every route suits every applicant. A quick consultation can save you time and money.' },
                { t: 'Documents matter most', d: 'Most refusals come down to missing or incorrect evidence. We check everything before you submit.' },
                { t: 'WhatsApp us for a fast answer', d: 'Message us on WhatsApp with your question and we will reply quickly during business hours.' },
              ].map((c) => (
                <div key={c.t} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
                  <h3 className="font-display text-lg font-semibold text-brand-950">{c.t}</h3>
                  <p className="mt-1.5 text-sm text-brand-700">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}