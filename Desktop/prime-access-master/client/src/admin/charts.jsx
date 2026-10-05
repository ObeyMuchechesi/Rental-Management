import { useMemo } from 'react';

/**
 * Lightweight dependency-free SVG charts used across the admin dashboard.
 */

export function AreaTrend({ data, color = '#2b7175', height = 190 }) {
  // data: [{ label, value }]
  const geom = useMemo(() => {
    const n = data.length;
    if (n === 0) return null;
    const max = Math.max(1, ...data.map((d) => d.value));
    const pts = data.map((d, i) => ({
      x: n === 1 ? 0 : (i / (n - 1)) * 100,
      y: 90 - (d.value / max) * 82,
    }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const area = `${line} L100,92 L0,92 Z`;
    return { line, area, max };
  }, [data]);

  if (!geom) return null;

  const ticks = [0.25, 0.5, 0.75, 1].map((f) => ({ y: 90 - f * 82, v: Math.round(geom.max * (1 - f)) }));

  return (
    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden="true">
        <defs>
          <linearGradient id="pa-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <line key={t.y} x1="0" x2="100" y1={t.y} y2={t.y} stroke="#0f373b" strokeOpacity="0.08" strokeWidth="1" />
        ))}
        <path d={geom.area} fill="url(#pa-trend-fill)" />
        <path d={geom.line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-brand-400">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function Donut({ segments, size = 168, thickness = 22 }) {
  // segments: [{ label, value, color }]
  const total = segments.reduce((s, x) => s + (x.value || 0), 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#dcefef" strokeWidth={thickness} />
      </svg>
    );
  }

  return (
    <div className="relative inline-flex">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#dcefef" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = `${Math.max(frac * c - 1.5, 0)} ${c}`;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={-acc * c}
            />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-brand-950">{total}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">total</span>
      </div>
    </div>
  );
}

export function HBarList({ items, color = 'bg-brand-900' }) {
  // items: [{ label, value }] - value-based horizontal bars
  const max = Math.max(1, ...items.map((x) => x.value));
  return (
    <ul className="mt-4 space-y-3">
      {items.map((it) => (
        <li key={it.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-brand-800">{it.label}</span>
            <span className={`shrink-0 text-xs font-semibold text-brand-500`}>{it.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-50">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${Math.max(2, (it.value / max) * 100)}%` }}
              title={`${it.label}: ${it.value}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
