"use client";

import { useEffect, useState } from "react";
import { Building2, MapPin, Plus, Trash2, Home, Store, DoorOpen } from "lucide-react";
import { Alert, Badge, EmptyState, Loading, PageHeader, btnDanger, btnPrimary, inputClass } from "@/app/components/ui";

const typeMeta = {
  apartment: { icon: Building2, tone: "blue" },
  house: { icon: Home, tone: "green" },
  commercial: { icon: Store, tone: "amber" },
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ name: "", address: "", type: "apartment" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/properties");
    const data = await res.json();
    if (res.ok) setProperties(data);
    else setError(data.error || "Failed to load properties");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Could not add property");
    setForm({ name: "", address: "", type: "apartment" });
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this property and all of its units, leases and payments?")) return;
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (!res.ok) setError((await res.json()).error || "Could not delete property");
    else load();
  };

  return (
    <main className="space-y-5 pb-10">
      <PageHeader
        eyebrow="Portfolio"
        title="Properties"
        subtitle="Buildings and houses you rent out, with how many units are taken."
        icon={Building2}
        actions={<Badge tone="blue">{properties.length} total</Badge>}
      />

      <form onSubmit={add} className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className={inputClass}
            placeholder="Property name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className={inputClass}
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
          <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="commercial">Commercial</option>
          </select>
          <button className={btnPrimary} disabled={busy}>
            <Plus className="h-4 w-4" /> {busy ? "Adding…" : "Add property"}
          </button>
        </div>
      </form>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading properties…" />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Add your first building above and it will show up here."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {properties.map((p) => {
            const meta = typeMeta[p.type] || typeMeta.apartment;
            const Icon = meta.icon;
            return (
              <article key={p._id} className="glass-card lift rounded-2xl p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 text-blue-600">
                      <Icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <p className="flex items-start gap-1.5 text-sm text-slate-600">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{p.address}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(p._id)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone={meta.tone}>{p.type}</Badge>
                  <Badge tone="slate">
                    <DoorOpen className="h-3.5 w-3.5" />
                    {p.occupiedCount}/{p.unitCount} units occupied
                  </Badge>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
