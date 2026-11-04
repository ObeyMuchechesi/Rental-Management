"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, Mail, Phone, ShieldCheck } from "lucide-react";
import { Alert, Badge, EmptyState, PageHeader, btnGhost, btnPrimary, inputClass } from "@/app/components/ui";

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => fetch("/api/tenants").then((r) => r.json()).then((d) => setTenants(Array.isArray(d) ? d : []));

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.json()).error || "Failed to add tenant");
      return;
    }
    setForm({ name: "", email: "", phone: "" });
    load();
  };

  return (
    <main className="space-y-5 pb-10">
      <PageHeader
        eyebrow="People"
        title="Tenants"
        subtitle="Tenancy records you can attach leases to. Accounts are approved separately."
        icon={Users}
        actions={
          <Link href="/approvals" className={btnGhost}>
            <ShieldCheck className="h-4 w-4" /> Approvals
          </Link>
        }
      />

      <form onSubmit={add} className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className={inputClass}
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className={inputClass}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className={inputClass}
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <button className={btnPrimary} disabled={busy}>
            <UserPlus className="h-4 w-4" /> {busy ? "Adding…" : "Add tenant"}
          </button>
        </div>
      </form>

      {err && <Alert>{err}</Alert>}

      {tenants.length === 0 ? (
        <EmptyState icon={Users} title="No tenants yet" description="Add a tenant, then attach them to a lease." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tenants.map((t) => (
            <article key={t._id} className="glass-card lift flex items-start gap-3 rounded-2xl p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold uppercase text-white">
                {t.name?.slice(0, 1) || "?"}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{t.name}</p>
                <p className="flex items-center gap-1.5 truncate text-sm text-slate-600">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{t.email}</span>
                </p>
                {t.phone ? (
                  <p className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {t.phone}
                  </p>
                ) : (
                  <Badge tone="slate" className="mt-1">
                    No phone
                  </Badge>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
