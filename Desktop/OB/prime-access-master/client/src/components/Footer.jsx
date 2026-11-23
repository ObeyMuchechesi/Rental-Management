import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, MessageCircle, Facebook } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { waLink, track, WHATSAPP_MESSAGE } from '../api';
import logoFull from '../assets/logo-full.png';

export default function Footer() {
  const { settings } = useSettings();
  if (!settings) return null;

  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={logoFull} alt={`${settings.brandName} logo`} className="w-44 max-w-full sm:w-52" />
          <p className="mt-4 text-sm leading-relaxed text-brand-300">{settings.aboutIntro?.slice(0, 180)}...</p>
          <div className="mt-4 flex gap-3">
            <a
              href={waLink(settings.whatsappNumber, WHATSAPP_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_click', { source: 'footer' })}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#25D366]"
              aria-label="WhatsApp"
            >
              <MessageCircle size={16} />
            </a>
            <a
              href={settings.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#1877F2]"
              aria-label="Facebook"
            >
              <Facebook size={16} />
            </a>
            <a
              href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
              onClick={() => track('call_click', { source: 'footer' })}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-brand-500"
              aria-label="Call"
            >
              <Phone size={16} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-400">Quick Links</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/" className="text-brand-300 hover:text-white">Home</Link></li>
            <li><Link to="/about" className="text-brand-300 hover:text-white">About Us</Link></li>
            <li><Link to="/services" className="text-brand-300 hover:text-white">Services</Link></li>
            <li><Link to="/flight-booking" className="text-brand-300 hover:text-white">Flight Booking</Link></li>
            <li><Link to="/contact" className="text-brand-300 hover:text-white">Contact</Link></li>
            <li><Link to="/privacy" className="text-brand-300 hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-brand-300 hover:text-white">Terms &amp; Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-400">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-brand-300">
            <li className="flex items-start gap-2.5"><Phone size={16} className="mt-0.5 shrink-0 text-gold-400" /> <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-white">{settings.phoneDisplay || settings.phone}</a></li>
            <li className="flex items-start gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0 text-gold-400" /> {settings.address}</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-400">Business Hours</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {settings.businessHours?.map((h) => (
              <li key={h.day} className="flex items-center justify-between gap-2 text-brand-300">
                <span className="flex items-center gap-2"><Clock size={13} className="text-gold-400" /> {h.day}</span>
                <span className={h.hours.toLowerCase() === 'closed' ? 'text-red-300' : 'text-brand-200'}>{h.hours}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-brand-400">Online inquiries accepted 24/7.</p>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="container-x flex flex-col items-center justify-between gap-2 text-xs text-brand-400 sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.brandName} {settings.tagline}. All rights reserved.</p>
          <p>
            <Link to="/privacy" className="hover:text-white">Privacy</Link> · <Link to="/terms" className="hover:text-white">Terms</Link> · <Link to="/admin/login" className="hover:text-white">Admin</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}