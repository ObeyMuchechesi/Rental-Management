import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Trash2, MessageCircle, Phone, Mail, X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { api, waLink, track } from '../api';
import { useSettings } from '../SettingsContext';
import { PageHeader, StatusBadge, NotifBadge, Spinner, Empty } from './ui';

const SWIPE_ACTIONS = [
  { key: 'whatsapp', icon: MessageCircle, bg: 'bg-[#25D366] text-white', label: 'WhatsApp' },
  { key: 'call', icon: Phone, bg: 'bg-brand-900 text-white', label: 'Call' },
  { key: 'email', icon: Mail, bg: 'bg-gold-500 text-brand-950', label: 'Email' },
];
const ACTION_W = SWIPE_ACTIONS.length * 68; // 204px reveal strip

// Swipe-left reveal card used on phones - mirrors the laptop table's row actions
export function MobileInquiryCard({ inquiry, onOpen, onRemove }) {
  const { settings } = useSettings();
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const suppressClick = useRef(false);

  const hrefFor = (key) => {
    if (key === 'whatsapp') {
      return waLink(settings?.whatsappNumber, `Hi ${inquiry.name}, thank you for your inquiry (${inquiry.reference}) about ${inquiry.service || 'our services'}. How can we help you further?`);
    }
    if (key === 'call') return `tel:${inquiry.phone.replace(/[^0-9+]/g, '')}`;
    return `mailto:${inquiry.email}`;
  };

  function onPointerDown(e) {
    drag.current = { x: e.clientX, y: e.clientY, startDx: dx, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    const deltaX = e.clientX - drag.current.x;
    const deltaY = Math.abs(e.clientY - drag.current.y);
    // Only treat clear horizontal movement as a swipe; let the browser keep vertical scroll
    if (!drag.current.moved && Math.abs(deltaX) < 8 && deltaY > Math.abs(deltaX)) return;
    if (Math.abs(deltaX) > 4) drag.current.moved = true;
    if (drag.current.moved) setDragging(true);
    setDx(Math.max(-ACTION_W, Math.min(0, drag.current.startDx + deltaX)));
  }
  function onPointerUp(e) {
    if (!drag.current) return;
    const { moved, x } = drag.current;
    drag.current = null;
    setDragging(false);
    if (moved) {
      const total = e.clientX - x;
      if (total < -4) suppressClick.current = true;
      setDx((v) => (v < -ACTION_W / 2 ? -ACTION_W : 0));
    }
  }

  return (
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-card">
      {/* Revealed swipe actions (right edge) */}
      <div className="absolute inset-y-0 right-0 flex" style={{ width: ACTION_W }}>
        {SWIPE_ACTIONS.map((a) => (
          <a
            key={a.key}
            href={hrefFor(a.key)}
            target={a.key === 'whatsapp' ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={() => track('whatsapp_click', { source: 'admin_reply' })}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${a.bg}`}
            onClick={() => a.key === 'whatsapp' && track('whatsapp_click', { source: 'admin_reply' })}
          >
            <a.icon size={18} /> {a.label}
          </a>
        ))}
      </div>

      {/* Foreground card */}
      <div
        className={`relative cursor-pointer bg-white p-4 ${dragging ? '' : 'transition-transform duration-200 ease-out'}`}
        style={{ transform: `translateX(${dx}px)`, touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => {
          if (suppressClick.current) { suppressClick.current = false; return; }
          if (dx < -8) { setDx(0); return; }
          onOpen();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-brand-950">{inquiry.name}</p>
            <p className="mt-0.5 truncate text-xs text-brand-500">{inquiry.phone} · {inquiry.email}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge status={inquiry.status} />
            <button
              className="rounded-lg p-1.5 text-brand-400 hover:bg-brand-100 hover:text-red-600"
              aria-label="Delete"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-brand-800">
          {inquiry.service || '—'}
          {inquiry.destination && <span className="text-brand-500"> · {inquiry.destination}</span>}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-brand-50 pt-2.5">
          <span className="font-mono text-[11px] font-semibold text-brand-500">{inquiry.reference}</span>
          <span className="text-xs text-brand-600">{new Date(inquiry.createdAt).toLocaleString()}</span>
        </div>
        <div className="mt-2">
          <NotifBadge notifications={inquiry.notifications} />
        </div>
      </div>
    </div>
  );
}

export default function Inquiries() {
  const { settings } = useSettings();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [params, setSearchParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState(null);

  function setStatus(s) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!s || s === 'all') next.delete('status');
      else next.set('status', s);
      return next;
    }, { replace: true });
  }

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit, q: debouncedQ });
      if (status !== 'all') params.set('status', status);
      const d = await api(`/admin/inquiries?${params}`);
      setItems(d.items);
      setTotal(d.total);
      setPages(d.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api('/admin/inquiries/stats/summary').then(setSummary).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  async function setStatusFor(id, s) {
    try {
      await api(`/admin/inquiries/${id}`, { method: 'PATCH', body: { status: s } });
      setSelected((sel) => (sel && sel._id === id ? { ...sel, status: s } : sel));
      load();
      api('/admin/inquiries/stats/summary').then(setSummary).catch(() => {});
    } catch (e) {
      alert(e.message);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this inquiry permanently?')) return;
    await api(`/admin/inquiries/${id}`, { method: 'DELETE' });
    setSelected(null);
    load();
  }

  const filterChips = [
    { key: 'all', label: `All (${summary?.total ?? '—'})` },
    { key: 'new', label: `New (${summary?.new ?? '—'})` },
    { key: 'in_progress', label: `In Progress (${summary?.in_progress ?? '—'})` },
    { key: 'completed', label: `Completed (${summary?.completed ?? '—'})` },
  ];

  return (
    <>
      <PageHeader
        title="Inquiries"
        subtitle={`${total} total · each new inquiry triggers an instant WhatsApp/email alert`}
        actions={
          <button onClick={load} className="btn-outline !py-2 text-xs"><RefreshCw size={14} /> Refresh</button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400" />
          <input className="input !pl-10" placeholder="Search name, email, phone, service, reference..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filterChips.map((c) => (
            <button
              key={c.key}
              onClick={() => { setStatus(c.key); setPage(1); }}
              className={`chip border px-3.5 py-2 ${status === c.key ? 'border-brand-900 bg-brand-900 text-white' : 'border-brand-200 bg-white text-brand-700 hover:border-brand-400'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? <Empty message="No inquiries match your filters." /> : (
        <>
          {/* Mobile card list - mirrors the laptop table columns with swipe actions */}
          <div className="grid gap-3 md:hidden">
            {items.map((i) => (
              <MobileInquiryCard
                key={i._id}
                inquiry={i}
                onOpen={() => setSelected(i)}
                onRemove={() => remove(i._id)}
              />
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-card md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-brand-100 bg-brand-50/60 text-xs uppercase tracking-wider text-brand-500">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Client</th>
                <th className="px-5 py-3.5 font-semibold">Service / Destination</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Alerts</th>
                <th className="px-5 py-3.5 font-semibold">Received</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {items.map((i) => (
                <tr key={i._id} className="cursor-pointer hover:bg-brand-50/40" onClick={() => setSelected(i)}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-brand-950">{i.name}</p>
                    <p className="text-xs text-brand-500">{i.phone} · {i.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-brand-800">{i.service || '—'}</p>
                    {i.destination && <p className="text-xs text-brand-500">{i.destination}</p>}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={i.status} /></td>
                  <td className="px-5 py-3.5"><NotifBadge notifications={i.notifications} /></td>
                  <td className="px-5 py-3.5 text-brand-600">{new Date(i.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="rounded-lg p-2 text-brand-400 hover:bg-brand-100 hover:text-brand-900" aria-label="Delete" onClick={(e) => { e.stopPropagation(); remove(i._id); }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-outline !px-3 !py-2 disabled:opacity-40"><ChevronLeft size={15} /></button>
          <span className="px-2 text-sm text-brand-600">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn-outline !px-3 !py-2 disabled:opacity-40"><ChevronRight size={15} /></button>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-brand-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={selected.status} />
                <span className="font-mono text-xs font-semibold text-brand-500">{selected.reference}</span>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md p-2 text-brand-500 hover:bg-brand-50" aria-label="Close"><X size={18} /></button>
            </div>

            <div className="flex-1 space-y-6 px-6 py-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-brand-950">{selected.name}</h2>
                <p className="mt-1 text-sm text-brand-600">Submitted {new Date(selected.createdAt).toLocaleString()}</p>
              </div>

              <div className="grid gap-2 text-sm">
                <p className="flex items-center gap-2 text-brand-800"><Phone size={15} className="text-gold-600" /> {selected.phone}</p>
                <p className="flex items-center gap-2 text-brand-800"><Mail size={15} className="text-gold-600" /> {selected.email}</p>
              </div>

              <div className="rounded-xl bg-brand-50/60 p-4 text-sm">
                <p><span className="font-semibold text-brand-900">Service:</span> {selected.service || '—'}</p>
                <p className="mt-1"><span className="font-semibold text-brand-900">Destination:</span> {selected.destination || '—'}</p>
                {selected.message && (
                  <p className="mt-3 border-t border-brand-100 pt-3 text-brand-800">“{selected.message}”</p>
                )}
              </div>

              {/* Quick actions */}
              <div>
                <p className="label">Update status</p>
                <div className="flex flex-wrap gap-2">
                  {['new', 'in_progress', 'completed'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFor(selected._id, s)}
                      className={`chip border px-4 py-2 capitalize ${selected.status === s ? 'border-brand-900 bg-brand-900 text-white' : 'border-brand-200 bg-white text-brand-700 hover:border-brand-400'}`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="label">Contact client</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={waLink(settings?.whatsappNumber, `Hi ${selected.name}, thank you for your inquiry (${selected.reference}) about ${selected.service || 'our services'}. How can we help you further?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('whatsapp_click', { source: 'admin_reply' })}
                    className="btn-whatsapp !px-4 !py-2.5 text-xs"
                  >
                    <MessageCircle size={14} /> Reply on WhatsApp
                  </a>
                  <a href={`tel:${selected.phone.replace(/[^0-9+]/g, '')}`} className="btn-outline !px-4 !py-2.5 text-xs"><Phone size={14} /> Call</a>
                  <a href={`mailto:${selected.email}`} className="btn-outline !px-4 !py-2.5 text-xs"><Mail size={14} /> Email</a>
                </div>
                <p className="mt-2 text-[11px] text-brand-500">
                  Tip: the “Reply on WhatsApp” button opens a pre-filled chat. For automatic delivery, configure Twilio or the Meta Cloud API on the server.
                </p>
              </div>

              {/* Notification history */}
              <div>
                <p className="label">Alert delivery</p>
                {selected.notifications?.length ? (
                  <ul className="space-y-2">
                    {selected.notifications.map((n, i) => (
                      <li key={i} className="flex items-center justify-between rounded-lg border border-brand-100 px-3.5 py-2.5 text-xs">
                        <span className="font-semibold capitalize text-brand-800">{n.channel}</span>
                        <span className={`font-semibold ${n.status === 'sent' ? 'text-green-600' : n.status === 'failed' ? 'text-red-600' : 'text-brand-400'}`}>
                          {n.status}{n.error ? ` - ${n.error}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-brand-500">No alerts recorded.</p>
                )}
              </div>

              <button onClick={() => { remove(selected._id); }} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700">
                <Trash2 size={14} /> Delete inquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}