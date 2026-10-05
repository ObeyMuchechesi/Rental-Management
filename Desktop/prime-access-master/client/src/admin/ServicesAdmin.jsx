import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, ExternalLink } from 'lucide-react';
import { api } from '../api';
import { PageHeader, Spinner, Empty } from './ui';

const EMPTY = {
  title: '', shortDescription: '', description: '', icon: 'briefcase', image: '',
  features: [''], whatsappMessage: '', popular: false, published: true, sortOrder: 0,
};

const ICON_OPTIONS = ['passport', 'plane', 'graduation', 'briefcase', 'globe', 'school', 'id', 'shield'];

export default function ServicesAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | service object
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems((await api('/admin/services')).items); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    try {
      const body = {
        ...editing,
        features: editing.features.filter((f) => f.trim()),
        published: !!editing.published,
        popular: !!editing.popular,
      };
      if (editing._id) {
        await api(`/admin/services/${editing._id}`, { method: 'PATCH', body });
      } else {
        await api('/admin/services', { method: 'POST', body });
      }
      setEditing(null);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this service?')) return;
    await api(`/admin/services/${id}`, { method: 'DELETE' });
    load();
  }

  async function togglePublished(item) {
    await api(`/admin/services/${item._id}`, { method: 'PATCH', body: { published: !item.published } });
    load();
  }

  return (
    <>
      <PageHeader
        title="Services"
        subtitle="Add, edit and publish the services shown on the website"
        actions={<button onClick={() => setEditing({ ...EMPTY })} className="btn-primary !py-2.5 text-xs"><Plus size={15} /> Add Service</button>}
      />

      {loading ? <Spinner /> : items.length === 0 ? <Empty message="No services yet. Add your first service." /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((s) => (
            <div key={s._id} className="flex flex-col rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-semibold text-brand-950">{s.title}</h3>
                  <p className="mt-0.5 text-xs text-brand-500">/{s.slug}</p>
                </div>
                <span className={`chip ${s.published ? 'bg-green-100 text-green-800' : 'bg-brand-100 text-brand-600'}`}>
                  {s.published ? 'Published' : 'Hidden'}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm text-brand-700">{s.shortDescription}</p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-brand-50 pt-4">
                <button onClick={() => setEditing(s)} className="btn-outline !px-3 !py-2 text-xs"><Pencil size={13} /> Edit</button>
                <button onClick={() => togglePublished(s)} className="btn-outline !px-3 !py-2 text-xs">{s.published ? <><X size={13} /> Unpublish</> : <><Check size={13} /> Publish</>}</button>
                <button onClick={() => remove(s._id)} className="btn-outline !px-3 !py-2 text-xs !text-red-600 hover:!border-red-300"><Trash2 size={13} /> Delete</button>
                <a href={`/services/${s.slug}`} target="_blank" rel="noopener noreferrer" className="btn-outline !px-3 !py-2 text-xs"><ExternalLink size={13} /> View</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-brand-950">{editing._id ? 'Edit Service' : 'New Service'}</h2>
              <button onClick={() => setEditing(null)} className="rounded-md p-2 text-brand-500 hover:bg-brand-50"><X size={18} /></button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. UK Visa & Immigration Support" />
              </div>
              <div>
                <label className="label">Short description * (shown on cards)</label>
                <textarea className="input" rows={2} value={editing.shortDescription} onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })} />
              </div>
              <div>
                <label className="label">Full description</label>
                <textarea className="input" rows={4} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Icon</label>
                  <select className="input" value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })}>
                    {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Sort order</label>
                  <input type="number" className="input" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <label className="label">Photo (image URL, optional)</label>
                <input className="input" value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="https://... (shown at the top of the service card)" />
                {editing.image && <img src={editing.image} alt="" className="mt-2 h-28 w-full rounded-xl object-cover" />}
              </div>

              <div>
                <label className="label">WhatsApp pre-filled message</label>
                <input className="input" value={editing.whatsappMessage} onChange={(e) => setEditing({ ...editing, whatsappMessage: e.target.value })} placeholder="Hi Prime Access, I need help with..." />
              </div>

              <div>
                <label className="label">Key features (one per line)</label>
                <textarea
                  className="input"
                  rows={4}
                  value={editing.features.join('\n')}
                  onChange={(e) => setEditing({ ...editing, features: e.target.value.split('\n') })}
                  placeholder={'Eligibility assessment\nDocument checking\nSubmission support'}
                />
              </div>

              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm font-medium text-brand-800">
                  <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="h-4 w-4 accent-brand-900" /> Published on website
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-brand-800">
                  <input type="checkbox" checked={editing.popular} onChange={(e) => setEditing({ ...editing, popular: e.target.checked })} className="h-4 w-4 accent-brand-900" /> Featured / popular
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-outline">Cancel</button>
              <button onClick={save} disabled={saving || !editing.title} className="btn-primary">{saving ? 'Saving...' : 'Save Service'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}