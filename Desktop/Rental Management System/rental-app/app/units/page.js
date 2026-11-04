"use client";

import { useEffect, useState } from "react";
import { DoorOpen, Plus, BedDouble, Bath, Building2, DollarSign } from "lucide-react";
import { Alert, Badge, EmptyState, Loading, PageHeader, btnPrimary, inputClass } from "@/app/components/ui";

const statusTone = { occupied: "green", vacant: "slate", maintenance: "amber" };

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ property: "", label: "", rentAmount: "", bedrooms: "", bathrooms: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [u, p] = await Promise.all([
      fetch("/api/units").then((r) => r.json()),
      fetch("/api/properties").then((r) => r.json()),
    ]);
    setUnits(Array.isArray(u) ? u : []);
    setProperties(Array.isArray(p) ? p : []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        rentAmount: Number(form.rentAmount),
        bedrooms: Number(form.bedrooms || 0),
        bathrooms: Number(form.bathrooms || 0),
      }),
    });
    setBusy(false);
    if (!res.ok) return setError((await res.json()).error || "Could not add unit");
    setForm({ property: "", label: "", rentAmount: "", bedrooms: "", bathrooms: "" });
    load();
  };

  return (
    <main className="space-y-5 pb-10">
      <PageHeader
        eyebrow="Portfolio"
        title="Units"
        subtitle="The individual spaces inside each property and what they rent for."
        icon={DoorOpen}
        actions={<Badge tone="blue">{units.length} units</Badge>}
      />

      <form onSubmit={submit} className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select
            className={`${inputClass} sm:col-span-2`}
            value={form.property}
            onChange={(e) => setForm({ ...form, property: e.target.value })}
            required
          >
            <option value="">Property…</option>
            {properties.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder="Unit label (e.g. A1)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
          />
          <input
            className={inputClass}
            placeholder="Rent / month"
            type="number"
            min="0"
            value={form.rentAmount}
            onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
            required
          />
          <input
            className={inputClass}
            placeholder="Bedrooms"
            type="number"
            min="0"
            value={form.bedrooms}
            onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
          />
          <button className={btnPrimary} disabled={busy}>
            <Plus className="h-4 w-4" /> {busy ? "Adding…" : "Add unit"}
          </button>
        </div>
      </form>

      {error && <Alert>{error}</Alert>}

      {units.length === 0 ? (
        <EmptyState icon={DoorOpen} title="No units yet" description="Add a property first, then its units with rent." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((u) => (
            <article key={u._id} className="glass-card lift rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-lg font-semibold text-slate-900">{u.label}</p>
                <Badge tone={statusTone[u.status] || "slate"}>{u.status}</Badge>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {u.property?.name || "—"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <Badge tone="green">
                  <DollarSign className="h-3.5 w-3.5" />
                  {u.rentAmount}/mo
                </Badge>
                {u.bedrooms ? (
                  <Badge tone="slate">
                    <BedDouble className="h-3.5 w-3.5" />
                    {u.bedrooms} bed
                  </Badge>
                ) : null}
                {u.bathrooms ? (
                  <Badge tone="slate">
                    <Bath className="h-3.5 w-3.5" />
                    {u.bathrooms} bath
                  </Badge>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
