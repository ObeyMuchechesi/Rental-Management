import { Link } from 'react-router-dom';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-950">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-brand-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}function Spark({ data, className }) {
  if (!data || data.length < 2) return null;
  const W = 100;
  const H = 26;
  const P = 1.5;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    P + (i * (W - P * 2)) / (data.length - 1),
    H - P - ((v - min) / range) * (H - P * 2),
  ]);
  const poly = pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const area = `0,${H} ${poly} ${W},${H}`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={`h-6 w-full ${className || ''}`} aria-hidden="true">
      <polygon points={area} className="fill-current opacity-10" />
      <polyline points={poly} fill="none" strokeWidth={1.5} className="stroke-current" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r={1.8} className="fill-current" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function StatCard({ label, value, icon: Icon, tone = 'brand', caption, to, spark, sparkClass }) {
  const tones = {
    brand: 'bg-brand-900 text-gold-400',
    green: 'bg-green-600 text-white',
    gold: 'bg-gold-500 text-brand-950',
    blue: 'bg-blue-600 text-white',
    gray: 'bg-brand-100 text-brand-800',
  };
  const shell = `flex h-full flex-col rounded-2xl border border-brand-100 bg-white p-4 shadow-card sm:p-5 ${to ? 'transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft' : ''}`;
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-brand-500 sm:text-xs">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tones[tone] ?? tone}`}>
          {Icon ? <Icon size={15} /> : null}
        </span>
      </div>
      <p className="mt-auto pt-1 font-display text-2xl font-bold leading-none text-brand-950 sm:pt-1.5 sm:text-3xl">{value ?? '—'}</p>
      {caption && <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-brand-400 sm:mt-1.5">{caption}</p>}
      {spark && <div className="mt-2"><Spark data={spark} className={sparkClass} /></div>}
    </>
  );
  return to ? <Link to={to} className={shell} title={`View ${label.toLowerCase()}`}>{inner}</Link> : <div className={shell}>{inner}</div>;
}

export function StatusBadge({ status }) {
  const map = {
    new: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-gold-100 text-gold-800',
    completed: 'bg-green-100 text-green-800',
  };
  const labels = { new: 'New', in_progress: 'In Progress', completed: 'Completed' };
  return <span className={`chip ${map[status] || 'bg-brand-100 text-brand-800'}`}>{labels[status] || status}</span>;
}

export function NotifBadge({ notifications }) {
  if (!notifications?.length) return <span className="chip bg-brand-100 text-brand-600">No alerts sent</span>;
  const ok = notifications.filter((n) => n.status === 'sent').length;
  const failed = notifications.filter((n) => n.status === 'failed').length;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {ok > 0 && <span className="chip bg-green-100 text-green-800">✓ {ok} sent</span>}
      {failed > 0 && <span className="chip bg-red-100 text-red-700" title={notifications.filter((n) => n.status === 'failed').map((n) => `${n.channel}: ${n.error}`).join('; ')}>✗ {failed} failed</span>}
      {ok === 0 && failed === 0 && <span className="chip bg-brand-100 text-brand-600">pending</span>}
    </span>
  );
}

export function Spinner({ label = 'Loading...' }) {
  return <div className="py-16 text-center text-sm text-brand-500">{label}</div>;
}

export function Empty({ message }) {
  return <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-10 text-center text-sm text-brand-500">{message}</div>;
}