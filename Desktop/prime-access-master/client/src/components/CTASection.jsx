import { Link } from 'react-router-dom';
import { MessageCircle, Phone, FileText } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { waLink, track, WHATSAPP_MESSAGE } from '../api';

export default function CTASection({ title = 'Ready to Start Your Journey?', subtitle = 'Speak to our consultants today - it is quick, confidential and free to ask questions.' }) {
  const { settings } = useSettings();
  if (!settings) return null;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-950 px-6 py-14 sm:rounded-[2.5rem] sm:px-12 sm:py-16 lg:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(86,173,165,0.18),transparent_55%)]" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full border border-brand-800/60" />
          <div className="pointer-events-none absolute -bottom-14 -right-8 h-40 w-40 rounded-full border border-brand-800/40" />

          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">{title}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-brand-200">{subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={waLink(settings.whatsappNumber, WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('whatsapp_click', { source: 'cta_band' })}
                className="btn-whatsapp"
              >
                <MessageCircle size={17} /> WhatsApp Us
              </a>
              <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} onClick={() => track('call_click', { source: 'cta_band' })} className="btn-light">
                <Phone size={17} /> Call Now
              </a>
              <Link to="/contact" className="btn !border !border-white/30 !bg-transparent !text-white hover:!bg-white/10">
                <FileText size={17} /> Make an Inquiry
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}