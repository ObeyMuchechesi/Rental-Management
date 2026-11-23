import { useSettings } from '../SettingsContext';
import { Megaphone } from 'lucide-react';

export default function AnnouncementBar() {
  const { settings } = useSettings();
  if (!settings?.announcementEnabled || !settings?.announcement) return null;
  return (
    <div className="bg-gold-500 text-brand-950">
      <div className="container-x flex items-center justify-center gap-2 py-2 text-center text-sm font-semibold">
        <Megaphone size={16} className="shrink-0" />
        <span>{settings.announcement}</span>
      </div>
    </div>
  );
}