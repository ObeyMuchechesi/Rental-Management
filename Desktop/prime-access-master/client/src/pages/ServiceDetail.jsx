import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MessageCircle, CheckCircle2, ArrowLeft, Compass, Plane, GraduationCap, Briefcase, Globe, School, BadgeCheck, ShieldCheck, CalendarCheck } from 'lucide-react';
import { api, waLink, track } from '../api';
import { useSettings } from '../SettingsContext';
import InquiryForm from '../components/InquiryForm';
import CTASection from '../components/CTASection';

const ICONS = {
  compass: Compass, plane: Plane, graduation: GraduationCap, briefcase: Briefcase,
  globe: Globe, school: School, id: BadgeCheck, shield: ShieldCheck,
};

export default function ServiceDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [service, setService] = useState(null);
  const [services, setServices] = useState([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api(`/services/${slug}`, { auth: false })
      .then((d) => { setService(d.item); track('service_view', { service: d.item.title }); })
      .catch(() => setNotFound(true));
    api('/services', { auth: false }).then((d) => setServices(d.items)).catch(() => {});
  }, [slug]);

  if (notFound) {
    return (
      <section className="container-x py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-brand-950">Service not found</h1>
        <p className="mt-2 text-brand-700">The service you are looking for does not exist or is no longer available.</p>
        <Link to="/services" className="btn-primary mt-6">Browse all services</Link>
      </section>
    );
  }

  if (!service || !settings) {
    return <div className="container-x py-24 text-center text-brand-600">Loading...</div>;
  }

  const Icon = ICONS[service.icon] || Briefcase;
  const waMessage = service.whatsappMessage || `Hi Prime Access, I need help with ${service.title}.`;
  const related = services.filter((s) => s._id !== service._id).slice(0, 3);

  return (
    <>
      <section className="bg-brand-950 py-14 lg:py-16">
        <div className="container-x">
          <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm font-medium text-brand-300 hover:text-white">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500 text-brand-950"><Icon size={26} /></span>
              <h1 className="mt-5 font-display text-4xl font-bold text-white sm:text-5xl">{service.title}</h1>
              <p className="mt-4 max-w-2xl text-lg text-brand-200">{service.shortDescription}</p>
            </div>
            <div className="flex flex-col gap-3 lg:min-w-[240px]">
              <a
                href={waLink(settings.whatsappNumber, waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('whatsapp_click', { service: service.title, source: 'service_detail' })}
                className="btn-whatsapp !px-6 !py-3.5 text-base"
              >
                <MessageCircle size={18} /> WhatsApp Us
              </a>
              <Link to="/contact" className="btn-light !px-6 !py-3.5 text-base">
                <CalendarCheck size={18} /> Book a Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-x">
          {service.image && (
            <img
              src={service.image}
              alt={service.title}
              className="mb-12 h-52 w-full rounded-[2rem] object-cover shadow-soft sm:h-72 lg:h-80"
            />
          )}
          <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
          <div>
            <h2 className="font-display text-2xl font-semibold text-brand-950">What This Service Includes</h2>
            <p className="mt-4 text-base leading-relaxed text-brand-800">{service.description}</p>

            {service.features?.length > 0 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {service.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
                    <CheckCircle2 size={18} className="shrink-0 text-gold-600" />
                    <span className="text-sm font-medium text-brand-900">{f}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-10 rounded-2xl border border-brand-100 bg-brand-50/60 p-6">
              <h3 className="font-display text-lg font-semibold text-brand-950">Ready to get started?</h3>
              <p className="mt-1.5 text-sm text-brand-700">
                Send an inquiry below and our team will be alerted instantly on WhatsApp. We will respond with clear next steps - usually the same business day.
              </p>
              <div className="mt-5">
                <InquiryForm services={services} defaultService={service.title} />
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold text-brand-950">Why choose this service?</h3>
              <ul className="mt-4 space-y-3">
                {[
                  'Expert, up-to-date knowledge of the requirements',
                  'Careful document review before submission',
                  'Direct WhatsApp communication with our team',
                  'Honest eligibility advice - no false promises',
                ].map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm text-brand-800">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-gold-600" /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-brand-900 p-6 text-white">
              <h3 className="font-display text-lg font-semibold">Prefer to talk?</h3>
              <p className="mt-1.5 text-sm text-brand-200">Chat with us on WhatsApp for a quick answer, or call during business hours.</p>
              <a
                href={waLink(settings.whatsappNumber, waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('whatsapp_click', { service: service.title, source: 'service_sidebar' })}
                className="btn-whatsapp mt-4 w-full"
              >
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
              <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} onClick={() => track('call_click', { service: service.title, source: 'service_sidebar' })} className="btn-light mt-2.5 w-full">
                Call {settings.phoneDisplay || settings.phone}
              </a>
            </div>
          </aside>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-brand-50/60 py-16">
          <div className="container-x">
            <h2 className="font-display text-2xl font-semibold text-brand-950">Related Services</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((s) => (
                <Link key={s._id} to={`/services/${s.slug}`} className="group rounded-2xl border border-brand-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft">
                  <h3 className="font-display text-lg font-semibold text-brand-950 group-hover:text-brand-700">{s.title}</h3>
                  <p className="mt-2 text-sm text-brand-700">{s.shortDescription.slice(0, 120)}...</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection />
    </>
  );
}