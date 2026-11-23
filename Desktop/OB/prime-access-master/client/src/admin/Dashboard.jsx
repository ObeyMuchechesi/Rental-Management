import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, ArrowRight, MessageCircle, Eye, Phone, Activity, FileText, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { api, waLink } from '../api';
import { useSettings } from '../SettingsContext';
import { PageHeader, StatCard, StatusBadge, NotifBadge, Spinner, Empty } from './ui';
import { AreaTrend, Donut, HBarList } from './charts';

const STATUS_COLORS = {
  new: '#3b82f6',
  in_progress: '#f59e0b',
  completed: '#22c55e',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recent, setRecent] = useState([]);
  const { settings } = useSettings();

  useEffect(() => {
    api('/admin/inquiries/stats/summary').then(setStats).catch(() => {});
    api('/admin/analytics?days=30').then(setAnalytics).catch(() => {});
    api('/admin/inquiries?limit=8').then((d) => setRecent(d.items)).catch(() => {});
  }, []);

  const timeline = analytics?.timeline || [];
  const totals = analytics?.totals || {};
  const statusSegments = stats
    ? [
        { label: 'New', value: stats.new, color: STATUS_COLORS.new },
        { label: 'In Progress', value: stats.in_progress, color: STATUS_COLORS.in_progress },
        { label: 'Completed', value: stats.completed, color: STATUS_COLORS.completed },
      ]
    : [];

  // Per-metric 30-day daily series for the card sparklines (only when the API provides them)
  const sparkOf = (key) =>
    timeline.length > 1 && timeline.every((t) => typeof t[key] === 'number')
      ? timeline.map((t) => t[key])
      : undefined;
  const series = {
    inquiries: sparkOf('inquiries'),
    pageviews: sparkOf('pageviews'),
    whatsapp: sparkOf('whatsappClicks'),
    calls: sparkOf('callClicks'),
  };

  const kpis = stats
    ? [
        { label: 'Total Inquiries', value: stats.total, icon: Inbox, tone: 'brand', to: '/admin/inquiries', spark: series.inquiries, sparkClass: 'text-brand-600' },
        { label: 'New', value: stats.new, icon: Zap, tone: 'blue', to: '/admin/inquiries?status=new' },
        { label: 'In Progress', value: stats.in_progress, icon: Clock, tone: 'gold', to: '/admin/inquiries?status=in_progress' },
        { label: 'Completed', value: stats.completed, icon: CheckCircle2, tone: 'green', to: '/admin/inquiries?status=completed' },
        { label: 'Page Views', value: totals.pageviews ?? '—', icon: Eye, tone: 'brand', caption: 'Last 30 days', to: '/admin/analytics', spark: series.pageviews, sparkClass: 'text-brand-600' },
        { label: 'Inquiries', value: totals.inquiries ?? '—', icon: FileText, tone: 'green', caption: 'Last 30 days', to: '/admin/inquiries', spark: series.inquiries, sparkClass: 'text-green-600' },
        { label: 'WhatsApp Clicks', value: totals.whatsappClicks ?? '—', icon: MessageCircle, tone: 'bg-[#25D366] text-white', caption: 'Last 30 days', to: '/admin/analytics', spark: series.whatsapp, sparkClass: 'text-[#25D366]' },
        { label: 'Call Clicks', value: totals.callClicks ?? '—', icon: Phone, tone: 'gold', caption: 'Last 30 days', to: '/admin/analytics', spark: series.calls, sparkClass: 'text-gold-600' },
      ]
    : [];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of inquiries, performance and alerts" />

      {/* KPIs - status + engagement in one side-by-side grid */}
      {!stats ? <Spinner /> : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} tone={k.tone} caption={k.caption} to={k.to} spark={k.spark} sparkClass={k.sparkClass} />
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Inquiries trend */}
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-brand-950">Inquiries over the last 30 days</h2>
              <p className="mt-0.5 text-xs text-brand-500">Daily inquiry submissions from the website</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
              <span className="h-2 w-4 rounded-full bg-[#2b7175]" /> Inquiries
            </span>
          </div>
          {timeline.length === 0 ? (
            <Empty message="Not enough analytics data yet - inquiries will appear here as they come in." />
          ) : (
            <div className="mt-5">
              <AreaTrend data={timeline.map((t) => ({ label: t.date, value: t.inquiries }))} />
            </div>
          )}
        </div>

        {/* Status donut */}
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-brand-950">Inquiry Status</h2>
          <p className="mt-0.5 text-xs text-brand-500">All-time split by status</p>
          {stats ? (
            <div className="mt-4 flex flex-col items-center">
              <Donut segments={statusSegments} />
              <ul className="mt-4 w-full space-y-1.5">
                {statusSegments.map((s) => (
                  <li key={s.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-brand-700">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.label}
                    </span>
                    <span className="font-semibold text-brand-950">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Spinner />
          )}
        </div>
      </div>

      {/* Most viewed services */}
      {analytics && analytics.topServices?.length > 0 && (
        <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-brand-950">Most Viewed Services</h2>
              <p className="mt-0.5 text-xs text-brand-500">Service pages clients explored in the last 30 days</p>
            </div>
            <Link to="/admin/analytics" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900">
              <Activity size={13} /> Full analytics <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-2 grid gap-x-8 md:grid-cols-2">
            <HBarList items={analytics.topServices.map((s) => ({ label: s._id, value: s.count }))} />
          </div>
        </div>
      )}

      {/* WhatsApp alert status */}
      <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-950">WhatsApp Alert Setup</h2>
            <p className="mt-1 text-sm text-brand-600">
              New inquiries trigger an instant alert. If no API provider is configured, alerts are delivered by email and the one-click WhatsApp shortcut below.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/settings" className="btn-outline !py-2 text-xs">Configure</Link>
            <a
              href={waLink(settings?.whatsappNumber, 'Hi Prime Access, this is a test alert from the admin dashboard.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp !py-2 text-xs"
            >
              <MessageCircle size={14} /> Send Test WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Recent inquiries */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-brand-950">Recent Inquiries</h2>
          <Link to="/admin/inquiries" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900">
            View all <ArrowRight size={15} />
          </Link>
        </div>
        {recent.length === 0 ? <Empty message="No inquiries yet. Submit one from the website's inquiry form to see it appear here instantly." /> : (
          <>
            {/* Mobile card list - same fields as the laptop table */}
            <div className="grid gap-3 md:hidden">
              {recent.map((i) => (
                <Link
                  key={i._id}
                  to="/admin/inquiries"
                  className="min-w-0 rounded-2xl border border-brand-100 bg-white p-4 shadow-card transition hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-brand-950">{i.name}</p>
                      <p className="mt-0.5 truncate text-xs text-brand-500">{i.phone}</p>
                    </div>
                    <StatusBadge status={i.status} />
                  </div>
                  <p className="mt-2 truncate text-sm text-brand-700">{i.service || '—'}</p>
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-brand-50 pt-2.5">
                    <span className="text-xs text-brand-600">{new Date(i.createdAt).toLocaleString()}</span>
                    <NotifBadge notifications={i.notifications} />
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-card md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-brand-100 bg-brand-50/60 text-xs uppercase tracking-wider text-brand-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Reference</th>
                  <th className="px-5 py-3.5 font-semibold">Client</th>
                  <th className="px-5 py-3.5 font-semibold">Service</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Alerts</th>
                  <th className="px-5 py-3.5 font-semibold">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {recent.map((i) => (
                  <tr key={i._id} className="hover:bg-brand-50/40">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-brand-700">{i.reference}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-brand-950">{i.name}</p>
                      <p className="text-xs text-brand-500">{i.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-brand-700">{i.service || '—'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={i.status} /></td>
                    <td className="px-5 py-3.5"><NotifBadge notifications={i.notifications} /></td>
                    <td className="px-5 py-3.5 text-brand-600">{new Date(i.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {!recent.length && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-100 bg-white p-5 text-sm text-brand-700 shadow-card">
          <Inbox size={18} className="mt-0.5 shrink-0 text-gold-600" />
          <p>
            <strong className="text-brand-950">Quick test:</strong> open the website, submit the inquiry form, then check this dashboard -
            the inquiry appears here instantly with its WhatsApp/email alert status.
          </p>
        </div>
      )}
    </>
  );
}
