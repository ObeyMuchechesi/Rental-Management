"use client";

import { Loader2 } from "lucide-react";

/* Shared presentation primitives so every screen looks like one product. */

export const inputClass =
  "w-full rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/15";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/60 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 disabled:pointer-events-none disabled:opacity-60";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-60";

export const btnSmall =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition";

const toneMap = {
  blue: "text-blue-600 bg-blue-500/10 text-blue-700",
  green: "text-green-700 bg-green-500/10",
  red: "text-red-700 bg-red-500/10",
  amber: "text-amber-700 bg-amber-500/10",
  slate: "text-slate-700 bg-slate-500/10",
};

export function Badge({ tone = "blue", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneMap[tone] || toneMap.blue} ${className}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({ eyebrow, title, subtitle, icon: Icon, actions }) {
  return (
    <header className="glass relative overflow-hidden rounded-3xl p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          {Icon ? (
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 sm:flex">
              <Icon className="h-6 w-6" strokeWidth={1.9} />
            </span>
          ) : null}
          <div>
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">{eyebrow}</p>
            ) : null}
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Panel({ className = "", children }) {
  return <section className={`glass-card rounded-2xl ${className}`}>{children}</section>;
}

export function StatCard({ icon: Icon, label, value, tone = "slate", hint }) {
  const colors = {
    slate: "text-slate-900",
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    amber: "text-amber-600",
  };
  const tiles = {
    slate: "from-slate-500/15 to-slate-500/5 text-slate-600",
    blue: "from-blue-500/20 to-cyan-500/10 text-blue-600",
    green: "from-emerald-500/20 to-green-500/10 text-green-600",
    red: "from-rose-500/20 to-red-500/10 text-red-600",
    amber: "from-amber-500/20 to-orange-500/10 text-amber-600",
  };
  return (
    <div className="glass-card lift rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-slate-500 sm:text-[11px] sm:tracking-[0.14em]">{label}</p>
        {Icon ? (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br sm:h-9 sm:w-9 sm:rounded-xl ${tiles[tone]}`}>
            <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-xl font-bold tracking-tight sm:mt-3 sm:text-[26px] ${colors[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="glass-card flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
      {Icon ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-blue-600 shadow-sm">
          <Icon className="h-6 w-6" strokeWidth={1.8} />
        </span>
      ) : null}
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="glass-card flex items-center justify-center gap-3 rounded-2xl px-6 py-12 text-sm text-slate-600">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function Alert({ tone = "red", children }) {
  const tones = {
    red: "border-red-200/80 bg-red-50/80 text-red-700",
    green: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700",
    blue: "border-blue-200/80 bg-blue-50/80 text-blue-700",
    amber: "border-amber-200/80 bg-amber-50/80 text-amber-800",
  };
  return (
    <p className={`rounded-xl border px-4 py-3 text-sm backdrop-blur ${tones[tone] || tones.red}`} role="alert">
      {children}
    </p>
  );
}
