"use client";

import { useEffect, useState } from "react";
import { ScrollText, Plus, CalendarDays, DoorOpen, User, DollarSign, CircleSlash } from "lucide-react";
import { Alert, Badge, EmptyState, PageHeader, btnGhost, btnPrimary, inputClass } from "@/app/components/ui";

const tone = { active: "green", ended: "slate", upcoming: "amber" };

export default function LeasesPage() {
  const [leases, setLeases] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ unit: "", tenant: "", startDate: "", endDate: "", monthlyRent: "", deposit: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [l, u, t] = await Promise.all([
      fetch("/api/leases").then((r) => r.json()),
      fetch("/api/units").then((r) => r.json()),
      fetch("/api/tenants").then((r) => r.json()),
    ]);
    setLeases(Array.isArray(l) ? l : []);
    setUnits(Array.isArray(u) ? u : []);
    setTenants(Array.isArray(t) ? t : []);
  };

  useEffect(() => {
    load();
  }, []);

  const availableUnits = units.filter((u) => u.status === "vacant");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/leases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        monthlyRent: Number(form.monthlyRent),
        deposit: Number(form.deposit || 0),
        status: "active",
      }),
    });
    setBusy(false);
    if (!res.ok) return setError((await res.json()).error || "Could not create the lease");
    setForm({ unit: "", tenant: "", startDate: "", endDate: "", monthlyRent: "", deposit: "" });
    load();
  };

  const endLease = async (id) => {
    await fetch(`/api/leases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ended" }),
    });
    load();
  };

  return (
    <main className="space-y-5 pb-10">
      <PageHeader
        eyebrow="Agreements"
        title="Leases"
        subtitle="Link a tenant to a vacant unit. Rent invoices are generated automatically."
        icon={ScrollText}
        actions={<Badge tone="blue">{leases.filter((l) => l.status === "active").length} active</Badge>}
      />

      <form onSubmit={submit} className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select
            className={inputClass}
            value={form.unit}
            onChange={(e) => {
              const u = units.find((x) => x._id === e.target.value);
              setForm({ ...form, unit: e.target.value, monthlyRent: u?.rentAmount ?? form.monthlyRent });
            }}
            required
          >
            <option value="">Vacant unit…</option>
            {availableUnits.map((u) => (
              <option key={u._id} value={u._id}>
                {u.label} — ${u.rentAmount}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={form.tenant}
            onChange={(e) => setForm({ ...form, tenant: e.target.value })}
            required
          >
            <option value="">Tenant…</option>
            {tenants.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Start
            <input type="date" className={`${inputClass} mt-1`} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            End
            <input type="date" className={`${inputClass} mt-1`} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Rent / month
            <input type="number" min="0" className={`${inputClass} mt-1`} value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} required />
          </label>
          <button className={`${btnPrimary} self-end`} disabled={busy}>
            <Plus className="h-4 w-4" /> {busy ? "Creating…" : "Create lease"}
          </button>
        </div>
      </form>

      {error && <Alert>{error}</Alert>}

      {leases.length === 0 ? (
        <EmptyState icon={ScrollText} title="No leases yet" description="Create a lease to start generating rent invoices." />
      ) : (
        <div className="space-y-3">
          {leases.map((l) => (
            <article key={l._id} className="glass-card rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-slate-900">
                    <DoorOpen className="h-4 w-4 text-slate-400" />
                    {l.unit?.property?.name ? `${l.unit.property.name} · ` : ""}
                    {l.unit?.label}
                    <span className="text-slate-300">/</span>
                    <User className="h-4 w-4 text-slate-400" />
                    {l.tenant?.name}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                      {l.monthlyRent}/mo
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={tone[l.status] || "slate"}>{l.status}</Badge>
                  {l.status === "active" && (
                    <button onClick={() => endLease(l._id)} className={btnGhost}>
                      <CircleSlash className="h-4 w-4" /> End lease
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
