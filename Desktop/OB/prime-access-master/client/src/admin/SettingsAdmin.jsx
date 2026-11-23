import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { PageHeader, Spinner } from './ui';

const DEFAULT_HOURS = [
  { day: 'Monday', hours: '8:00 AM - 5:00 PM' },
  { day: 'Tuesday', hours: '8:00 AM - 5:00 PM' },
  { day: 'Wednesday', hours: '8:00 AM - 5:00 PM' },
  { day: 'Thursday', hours: '8:00 AM - 5:00 PM' },
  { day: 'Friday', hours: '8:00 AM - 5:00 PM' },
  { day: 'Saturday', hours: '9:00 AM - 1:00 PM' },
  { day: 'Sunday', hours: 'Closed' },
];

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-brand-500">{hint}</p>}
    </div>
  );
}

export default function SettingsAdmin() {
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pass, setPass] = useState({ currentPassword: '', newPassword: '' });
  const [passMsg, setPassMsg] = useState('');

  useEffect(() => {
    api('/admin/settings').then((d) => setSettings(d.settings)).catch(() => {});
  }, []);

  if (!settings) return <Spinner />;

  const set = (key) => (e) => setSettings({ ...settings, [key]: e.target.value });
  const setTestimonial = (i, key, value) => {
    const testimonials = [...(settings.testimonials || [])];
    testimonials[i] = { ...testimonials[i], [key]: value };
    setSettings({ ...settings, testimonials });
  };
  const setVideo = (i, key, value) => {
    const videos = [...(settings.videos || [])];
    videos[i] = { ...videos[i], [key]: value };
    setSettings({ ...settings, videos });
  };

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const d = await api('/admin/settings', { method: 'PUT', body: settings });
      setSettings(d.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPassMsg('');
    try {
      await api('/auth/change-password', { method: 'POST', body: pass });
      setPass({ currentPassword: '', newPassword: '' });
      setPassMsg('Password updated successfully.');
    } catch (err) {
      setPassMsg(err.message);
    }
  }

  const card = 'rounded-2xl border border-brand-100 bg-white p-6 shadow-card';
  const cardTitle = 'font-display text-lg font-semibold text-brand-950';

  return (
    <>
      <PageHeader
        title="Site Settings"
        subtitle="Edit business details, hours, content and SEO - changes appear on the website immediately"
        actions={
          <button onClick={save} disabled={saving} className="btn-primary !py-2.5 text-xs">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save All Changes</>}
          </button>
        }
      />

      <div className="space-y-6">
        {/* Brand & Hero */}
        <div className={card}>
          <h2 className={cardTitle}>Brand & Hero</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Brand name"><input className="input" value={settings.brandName} onChange={set('brandName')} /></Field>
            <Field label="Tagline"><input className="input" value={settings.tagline} onChange={set('tagline')} /></Field>
            <Field label="Hero title"><input className="input" value={settings.heroTitle} onChange={set('heroTitle')} /></Field>
            <Field label="Hero subtitle"><input className="input" value={settings.heroSubtitle} onChange={set('heroSubtitle')} /></Field>
          </div>
        </div>

        {/* Announcement */}
        <div className={card}>
          <h2 className={cardTitle}>Announcement Banner</h2>
          <div className="mt-5 space-y-4">
            <Field label="Announcement text" hint="Shown in a gold banner at the top of every page when enabled.">
              <input className="input" value={settings.announcement} onChange={set('announcement')} placeholder="e.g. New: UK eVisa assistance now available - WhatsApp us!" />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-800">
              <input type="checkbox" className="h-4 w-4 accent-brand-900" checked={!!settings.announcementEnabled} onChange={(e) => setSettings({ ...settings, announcementEnabled: e.target.checked })} />
              Show announcement banner
            </label>
          </div>
        </div>

        {/* Contact */}
        <div className={card}>
          <h2 className={cardTitle}>Contact Details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Phone (display)"><input className="input" value={settings.phoneDisplay} onChange={set('phoneDisplay')} /></Field>
            <Field label="Phone (dial link)"><input className="input" value={settings.phone} onChange={set('phone')} /></Field>
            <Field label="WhatsApp number (digits only, with country code)" hint="e.g. 447829841469 - used for all WhatsApp buttons.">
              <input className="input" value={settings.whatsappNumber} onChange={set('whatsappNumber')} />
            </Field>
            <Field label="Email"><input className="input" value={settings.email} onChange={set('email')} /></Field>
            <Field label="Address"><input className="input" value={settings.address} onChange={set('address')} /></Field>
            <Field label="Facebook page URL"><input className="input" value={settings.facebookUrl} onChange={set('facebookUrl')} /></Field>
            <Field label="Google Maps embed URL" hint="Optional iframe URL shown on the Contact page.">
              <input className="input" value={settings.mapEmbedUrl} onChange={set('mapEmbedUrl')} />
            </Field>
          </div>
        </div>

        {/* Business hours */}
        <div className={card}>
          <h2 className={cardTitle}>Business Hours</h2>
          <p className="mt-1 text-sm text-brand-600">Shown on the homepage, contact page and footer.</p>
          <div className="mt-5 space-y-2.5">
            {(settings.businessHours?.length ? settings.businessHours : DEFAULT_HOURS).map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <input className="input max-w-[180px] font-medium" value={h.day} onChange={(e) => {
                  const hours = [...(settings.businessHours || DEFAULT_HOURS)];
                  hours[i] = { ...hours[i], day: e.target.value };
                  setSettings({ ...settings, businessHours: hours });
                }} />
                <input className="input" value={h.hours} onChange={(e) => {
                  const hours = [...(settings.businessHours || DEFAULT_HOURS)];
                  hours[i] = { ...hours[i], hours: e.target.value };
                  setSettings({ ...settings, businessHours: hours });
                }} placeholder="e.g. 8:00 AM - 5:00 PM or Closed" />
                <button onClick={() => setSettings({ ...settings, businessHours: settings.businessHours.filter((_, j) => j !== i) })} className="rounded-lg p-2 text-brand-400 hover:bg-brand-50 hover:text-red-600" aria-label="Remove day"><Trash2 size={15} /></button>
              </div>
            ))}
            <button
              onClick={() => setSettings({ ...settings, businessHours: [...(settings.businessHours || DEFAULT_HOURS), { day: '', hours: '' }] })}
              className="btn-outline !py-2 text-xs"
            >
              <Plus size={14} /> Add day
            </button>
          </div>
        </div>

        {/* About + testimonials */}
        <div className={card}>
          <h2 className={cardTitle}>About & Testimonials</h2>
          <div className="mt-5 space-y-5">
            <Field label="About intro (used on homepage and About page)">
              <textarea className="input" rows={3} value={settings.aboutIntro} onChange={set('aboutIntro')} />
            </Field>
            <div>
              <p className="label">Testimonials</p>
              {(settings.testimonials || []).map((t, i) => (
                <div key={i} className="mb-3 rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input className="input" placeholder="Name" value={t.name} onChange={(e) => setTestimonial(i, 'name', e.target.value)} />
                    <input className="input" placeholder="Location" value={t.location} onChange={(e) => setTestimonial(i, 'location', e.target.value)} />
                    <input type="number" min={1} max={5} className="input" placeholder="Rating (1-5)" value={t.rating} onChange={(e) => setTestimonial(i, 'rating', Number(e.target.value))} />
                  </div>
                  <textarea className="input mt-3" rows={2} placeholder="Testimonial text" value={t.text} onChange={(e) => setTestimonial(i, 'text', e.target.value)} />
                  <button onClick={() => setSettings({ ...settings, testimonials: settings.testimonials.filter((_, j) => j !== i) })} className="mt-2 text-xs font-medium text-red-600 hover:text-red-700">Remove testimonial</button>
                </div>
              ))}
              <button onClick={() => setSettings({ ...settings, testimonials: [...(settings.testimonials || []), { name: '', location: '', text: '', rating: 5 }] })} className="btn-outline !py-2 text-xs">
                <Plus size={14} /> Add testimonial
              </button>
            </div>
          </div>
        </div>

        {/* Videos */}
        <div className={card}>
          <h2 className={cardTitle}>Homepage Videos</h2>
          <p className="mt-1 text-sm text-brand-600">
            Paste a YouTube / Vimeo link, or upload video files in the <b>Media & Videos</b> section and paste the /uploads/... path here.
          </p>
          <div className="mt-5 space-y-3">
            {(settings.videos || []).map((v, i) => (
              <div key={i} className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                  <input className="input" placeholder="Title" value={v.title} onChange={(e) => setVideo(i, 'title', e.target.value)} />
                  <input className="input" placeholder="https://www.youtube.com/watch?v=... or /uploads/file.mp4" value={v.url} onChange={(e) => setVideo(i, 'url', e.target.value)} />
                  <label className="flex items-center gap-2 text-xs font-medium text-brand-800">
                    <input type="checkbox" className="h-4 w-4 accent-brand-900" checked={!!v.published} onChange={(e) => setVideo(i, 'published', e.target.checked)} /> Show
                  </label>
                </div>
                <button onClick={() => setSettings({ ...settings, videos: settings.videos.filter((_, j) => j !== i) })} className="mt-2 text-xs font-medium text-red-600 hover:text-red-700">Remove video</button>
              </div>
            ))}
            <button onClick={() => setSettings({ ...settings, videos: [...(settings.videos || []), { title: '', url: '', published: true }] })} className="btn-outline !py-2 text-xs">
              <Plus size={14} /> Add video
            </button>
          </div>
        </div>

        {/* SEO */}
        <div className={card}>
          <h2 className={cardTitle}>SEO</h2>
          <div className="mt-5 grid gap-4">
            <Field label="SEO title" hint={`Currently: ${settings.seoTitle} (${(settings.seoTitle || '').length} chars)`}>
              <input className="input" value={settings.seoTitle} onChange={set('seoTitle')} />
            </Field>
            <Field label="Meta description" hint={`Currently: ${(settings.seoDescription || '').length} chars - aim for 150-160`}>
              <textarea className="input" rows={3} value={settings.seoDescription} onChange={set('seoDescription')} />
            </Field>
          </div>
        </div>

        {/* Change password */}
        <div className={card}>
          <h2 className={cardTitle}>Change Password</h2>
          <form onSubmit={changePassword} className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Current password">
              <input type="password" className="input" value={pass.currentPassword} onChange={(e) => setPass({ ...pass, currentPassword: e.target.value })} required />
            </Field>
            <Field label="New password (min 8 chars)">
              <input type="password" className="input" value={pass.newPassword} onChange={(e) => setPass({ ...pass, newPassword: e.target.value })} required minLength={8} />
            </Field>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-outline !py-2.5 text-xs"><KeyRound size={14} /> Update Password</button>
              {passMsg && <p className={`mt-2 text-sm font-medium ${passMsg.includes('successfully') ? 'text-green-700' : 'text-red-600'}`}>{passMsg}</p>}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}