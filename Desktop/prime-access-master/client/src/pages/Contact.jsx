import { useEffect, useState } from 'react';
import { Phone, MapPin, MessageCircle, Clock, Facebook } from 'lucide-react';
import { api, waLink, track, WHATSAPP_MESSAGE } from '../api';
import { useSettings } from '../SettingsContext';
import InquiryForm from '../components/InquiryForm';
import CTASection from '../components/CTASection';
import collageImg from '../assets/collage-prime.jpg';

export default function Contact() {
  const { settings } = useSettings();
  const [services, setServices] = useState([]);

  useEffect(() => {
    api('/services', { auth: false }).then((d) => setServices(d.items)).catch(() => {});
  }, []);

  if (!settings) return null;

  const phoneHref = `tel:${settings.phone.replace(/[^0-9+]/g, '')}`;
  const waHref = waLink(settings.whatsappNumber, WHATSAPP_MESSAGE);

  return (
    <>
      <section className="relative overflow-hidden bg-brand-950 py-16 lg:py-20">
        {/* Full-bleed photo backdrop, veiled so the copy stays readable */}
        <img
          src={collageImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-brand-950/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/75 to-brand-950/35" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-950 to-transparent" />
        <div className="container-x relative text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-400">Contact Us</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">Let's Start the Conversation</h1>
          <p className="mx-auto mt-4 max-w-2xl text-brand-300">
            WhatsApp, call or send an inquiry - however you prefer to talk, our team is ready to help. Online inquiries are accepted 24/7.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-x grid gap-12 lg:grid-cols-[400px_1fr]">
          {/* Left: contact methods */}
          <div className="min-w-0 space-y-4">
            <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { source: 'contact_page' })} className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-card transition hover:shadow-soft">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white"><MessageCircle size={22} /></span>
              <span>
                <span className="block font-semibold text-brand-950">WhatsApp</span>
                <span className="block text-sm text-brand-600">Chat instantly - fastest way to reach us</span>
              </span>
            </a>

            <a href={phoneHref} onClick={() => track('call_click', { source: 'contact_page' })} className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-card transition hover:shadow-soft">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-500 text-brand-950"><Phone size={22} /></span>
              <span>
                <span className="block font-semibold text-brand-950">{settings.phoneDisplay || settings.phone}</span>
                <span className="block text-sm text-brand-600">Tap to call during business hours</span>
              </span>
            </a>

            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-card transition hover:shadow-soft">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1877F2] text-white"><Facebook size={22} /></span>
                <span>
                  <span className="block font-semibold text-brand-950">Facebook</span>
                  <span className="block text-sm text-brand-600">Follow us for updates and tips</span>
                </span>
              </a>
            )}

            <div className="flex items-start gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-900"><MapPin size={22} /></span>
              <span>
                <span className="block font-semibold text-brand-950">{settings.address}</span>
                <span className="block text-sm text-brand-600">Visits by appointment - WhatsApp us to arrange</span>
              </span>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-brand-950"><Clock size={16} className="text-gold-600" /> Business Hours</p>
              <ul className="mt-3 space-y-2">
                {settings.businessHours?.map((h) => (
                  <li key={h.day} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-brand-700">{h.day}</span>
                    {h.hours.toLowerCase() === 'closed' ? (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">Closed</span>
                    ) : (
                      <span className="font-medium text-brand-900">{h.hours}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-brand-100 pt-3 text-xs leading-relaxed text-brand-600">
                Office closed on weekends - WhatsApp inquiries are still answered, message us any time.
              </p>
            </div>
          </div>

          {/* Right: form + map */}
          <div className="min-w-0">
            <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-brand-950">Make an Inquiry</h2>
              <p className="mt-1 text-sm text-brand-700">
                Complete the form and Prime Access receives an instant WhatsApp alert - we will get back to you quickly.
              </p>
              <div className="mt-6"><InquiryForm services={services} /></div>
            </div>

            {settings.mapEmbedUrl && (
              <div className="mt-6 overflow-hidden rounded-3xl border border-brand-100 shadow-card">
                <iframe
                  src={settings.mapEmbedUrl}
                  title="Prime Access location"
                  className="h-[300px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}