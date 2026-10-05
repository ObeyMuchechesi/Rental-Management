import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Phone, MessageCircle, MapPin, Facebook } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { waLink, track, WHATSAPP_MESSAGE } from '../api';
import logoMark from '../assets/logo-mark.png';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/services', label: 'Services' },
  { to: '/flight-booking', label: 'Flights' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);

  if (!settings) {
    return (
      <header className="sticky top-0 z-40 border-b border-brand-100 bg-white">
        <div className="container-x flex h-16 items-center justify-between">
          <span className="font-display text-lg font-bold text-brand-950">Prime Access</span>
        </div>
      </header>
    );
  }

  const phone = settings.phone || '+263772401643';
  const whatsapp = settings.whatsappNumber || '447829841469';
  const telHref = `tel:${phone.replace(/[^0-9+]/g, '')}`;

  return (
    <>
      {/* Top contact strip */}
      <div className="bg-brand-950 text-brand-100">
        <div className="container-x flex h-10 items-center justify-between gap-4 text-xs">
          <p className="flex min-w-0 items-center gap-1.5">
            <MapPin size={13} className="shrink-0 text-gold-400" />
            <span className="truncate">{settings.address}</span>
          </p>
          <div className="flex shrink-0 items-center gap-4 sm:gap-5">
            <a href={telHref} onClick={() => track('call_click', { source: 'topbar' })} className="flex items-center gap-1.5 transition hover:text-white">
              <Phone size={13} className="text-gold-400" /> {settings.phoneDisplay || phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/95 backdrop-blur">
        <div className="container-x flex h-[72px] items-center justify-between gap-2 sm:gap-4">
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5" onClick={() => setOpen(false)}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-950 p-0.5 ring-1 ring-gold-500/40 sm:h-11 sm:w-11 sm:p-1.5">
              <img src={logoMark} alt="" aria-hidden="true" className="h-full w-full object-contain" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-base font-extrabold tracking-tight text-brand-950 sm:text-xl">
                {settings.brandName || 'Prime Access'}
              </span>
              <span className="block truncate text-[8px] font-semibold uppercase tracking-[0.08em] text-gold-600 sm:text-[10px] sm:tracking-[0.18em]">
                {settings.tagline || 'Immigration Consultancy Firm'}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-950 text-white' : 'text-brand-800 hover:bg-brand-100 hover:text-brand-950'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
            <a href={waLink(whatsapp, WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { source: 'navbar_mobile' })} aria-label="WhatsApp Us" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-card transition hover:bg-[#1eb958] sm:h-10 sm:w-10">
              <MessageCircle size={17} />
            </a>
            <a href={telHref} onClick={() => track('call_click', { source: 'navbar_mobile' })} aria-label="Call Now" className="hidden h-10 w-10 items-center justify-center rounded-full bg-brand-950 text-white shadow-card transition hover:bg-brand-800 sm:flex">
              <Phone size={17} />
            </a>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <a href={waLink(whatsapp, WHATSAPP_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_click', { source: 'navbar' })}
              className="btn-whatsapp !px-5 !py-2.5 text-xs"
            >
              <MessageCircle size={15} /> WhatsApp Us
            </a>
            <a href={telHref} onClick={() => track('call_click', { source: 'navbar' })} className="btn-primary !px-5 !py-2.5 text-xs">
              <Phone size={15} /> Call Now
            </a>
          </div>

          <button className="shrink-0 rounded-md p-1.5 text-brand-950 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="border-t border-brand-100 bg-white lg:hidden">
            <div className="container-x flex flex-col gap-1 py-4">
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-950 text-white' : 'text-brand-800'}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={waLink(whatsapp, WHATSAPP_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('whatsapp_click', { source: 'navbar' })}
                  className="btn-whatsapp"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
                <a href={telHref} onClick={() => track('call_click', { source: 'navbar' })} className="btn-primary">
                  <Phone size={15} /> Call Now
                </a>
              </div>
              <p className="flex items-center gap-2 px-3 text-sm text-brand-700">
                <MapPin size={15} /> {settings.address}
              </p>
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-brand-700"
                >
                  <Facebook size={15} /> Follow us on Facebook
                </a>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}