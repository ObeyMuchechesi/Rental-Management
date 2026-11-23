import { useEffect, useState } from 'react';
import { Eye, MessageCircle, Phone, FileText, Activity } from 'lucide-react';
import { api } from '../api';
import { PageHeader, Spinner } from './ui';

const DAY_OPTIONS = [7, 30, 90];

export default function AnalyticsAdmin() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api(`/admin/analytics?days=${days}`).then(setData).catch((e) => alert(e.message));
  }, [days]);

  const maxTimeline = Math.max(1, ...(data?.timeline || []).map((t) => t.events));

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Visitors, engagement and inquiry performance"
        actions={
          <div className="flex gap-1.5">
            {DAY_OPTIONS.map((d) => (
              <button key={d} onClick={() => setDays(d)} className={`chip border px-3.5 py-2 ${days === d ? 'border-brand-900 bg-brand-900 text-white' : 'border-brand-200 bg-white text-brand-700'}`}>
                {d}d
              </button>
            ))}
          </div>
        }
      />

      {!data ? <Spinner /> : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {[
              { label: 'Page Views', value: data.totals.pageviews, icon: Eye, tone: 'bg-brand-900 text-gold-400' },
              { label: 'Inquiries', value: data.totals.inquiries, icon: FileText, tone: 'bg-green-600 text-white' },
              { label: 'WhatsApp Clicks', value: data.totals.whatsappClicks, icon: MessageCircle, tone: 'bg-[#25D366] text-white' },
              { label: 'Call Clicks', value: data.totals.callClicks, icon: Phone, tone: 'bg-gold-500 text-brand-950' },
              { label: 'Service Views', value: data.totals.serviceViews, icon: Activity, tone: 'bg-blue-600 text-white' },
            ].map((s, i) => (
              <div key={s.label} className={`rounded-2xl border border-brand-100 bg-white p-4 shadow-card sm:p-5 ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">{s.label}</p>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.tone}`}><s.icon size={15} /></span>
                </div>
                <p className="mt-2 font-display text-3xl font-bold text-brand-950">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold text-brand-950">Activity over the last {data.days} days</h2>
            <div className="mt-6 flex h-40 items-end gap-[2px]">
              {data.timeline.map((t) => (
                <div key={t.date} className="group relative flex flex-1 flex-col justify-end" title={`${t.date}: ${t.events} events, ${t.inquiries} inquiries`}>
                  <div className="w-full rounded-t bg-brand-900/80 transition group-hover:bg-brand-900" style={{ height: `${Math.max(2, (t.events / maxTimeline) * 100)}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-brand-400">
              <span>{data.timeline[0]?.date}</span>
              <span>today</span>
            </div>
            <p className="mt-4 text-xs text-brand-500">
              Events include page views, service views and WhatsApp/call clicks. Inquiries are counted separately in green bars (see tooltip).
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Top pages */}
            <div className="min-w-0 rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold text-brand-950">Top Pages</h2>
              {data.topPages.length === 0 ? <p className="mt-3 text-sm text-brand-500">Not enough data yet.</p> : (
                <ul className="mt-4 space-y-2.5">
                  {data.topPages.map((p) => (
                    <li key={p._id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-mono text-xs text-brand-700">{p._id}</span>
                      <span className="chip bg-brand-100 text-brand-800">{p.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top services */}
            <div className="min-w-0 rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold text-brand-950">Most Viewed Services</h2>
              {data.topServices.length === 0 ? <p className="mt-3 text-sm text-brand-500">Not enough data yet.</p> : (
                <ul className="mt-4 space-y-2.5">
                  {data.topServices.map((p) => (
                    <li key={p._id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-brand-800">{p._id}</span>
                      <span className="chip bg-gold-100 text-gold-800">{p.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}