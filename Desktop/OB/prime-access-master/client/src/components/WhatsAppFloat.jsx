import { MessageCircle } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { waLink, track, WHATSAPP_MESSAGE } from '../api';

export default function WhatsAppFloat() {
  const { settings } = useSettings();
  if (!settings) return null;

  return (
    <a
      href={waLink(settings.whatsappNumber, WHATSAPP_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('whatsapp_click', { source: 'floating_button' })}
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2"
      aria-label="Chat with us on WhatsApp"
    >
      <span className="pointer-events-none hidden translate-x-1 rounded-lg bg-brand-950 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-soft transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
        Chat with us now
      </span>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft transition-transform hover:scale-105">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30" />
        <MessageCircle size={26} className="relative" />
      </span>
    </a>
  );
}