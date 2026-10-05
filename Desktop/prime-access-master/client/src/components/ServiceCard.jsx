import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Compass, Plane, GraduationCap, Briefcase, Globe, School, BadgeCheck, ShieldCheck } from 'lucide-react';
import { waLink, track } from '../api';
import { useSettings } from '../SettingsContext';

const ICONS = {
  compass: Compass,
  plane: Plane,
  graduation: GraduationCap,
  briefcase: Briefcase,
  globe: Globe,
  school: School,
  id: BadgeCheck,
  shield: ShieldCheck,
};

export default function ServiceCard({ service }) {
  const { settings } = useSettings();
  const Icon = ICONS[service.icon] || Briefcase;
  const waMessage = service.whatsappMessage || `Hi Prime Access, I need help with ${service.title}.`;
  const hasImage = Boolean(service.image);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft">
      {hasImage && (
        <div className="relative h-44 overflow-hidden">
          <img
            src={service.image}
            alt={service.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-brand-950/40 via-transparent to-transparent" />
          <span className="absolute bottom-3 left-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-brand-950 shadow-card">
            <Icon size={20} />
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        {!hasImage && (
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-900 text-gold-400 transition group-hover:bg-gold-500 group-hover:text-brand-950">
            <Icon size={22} />
          </span>
        )}
        <h3 className="mt-4 font-display text-lg font-semibold text-brand-950">{service.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-700">{service.shortDescription}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to={`/services/${service.slug}`} onClick={() => track('service_view', { service: service.title })} className="btn-outline !px-4 !py-2 text-xs">
            Learn More <ArrowRight size={14} />
          </Link>
          <a
            href={waLink(settings?.whatsappNumber, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp_click', { service: service.title, source: 'service_card' })}
            className="btn-whatsapp !px-4 !py-2 text-xs"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
