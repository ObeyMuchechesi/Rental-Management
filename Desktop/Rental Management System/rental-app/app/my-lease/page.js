"use client";

import { useEffect, useState } from "react";
import { ScrollText, MapPin, CalendarDays, DollarSign, Wallet, Wrench } from "lucide-react";
import { Alert, Badge, EmptyState, Loading, PageHeader, StatCard, btnGhost } from "@/app/components/ui";
import Link from "next/link";

export default function MyLeasePage() {
  const [data, setData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/dashboard"), fetch("/api/payments"), fetch("/api/maintenance")])
      .then(async ([d, p, m]) => {
        const dashboard = await d.json();
        if (!d.ok) throw new Error(dashboard.error || "Failed to load lease");
        setData(dashboard);
        setPayments(p.ok ? await p.json() : []);
        setRequests(m.ok ? await m.json() : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="space-y-5 pb-10">
        <PageHeader title="My lease" icon={ScrollText} />
        <Loading label="Loading your lease…" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-5 pb-10">
        <PageHeader title="My lease" icon={ScrollText} />
        <Alert>{error}</Alert>
      </main>
    );
  }

  const lease = data?.lease;
  const unpaid = payments.filter((p) => p.status !== "paid");
  const outstanding = unpaid.reduce((s, p) => s + p.amount, 0);

  return (
    <main className="space-y-5 pb-10">
      <PageHeader
        eyebrow="Tenant portal"
        title="My lease"
        subtitle="Your home, the agreement and everything you owe."
        icon={ScrollText}
        actions={
          <Link href="/payments" className={btnGhost}>
            <Wallet className="h-4 w-4" /> Payments
          </Link>
        }
      />

      {lease ? (
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Property</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {lease.unit?.property?.name} · {lease.unit?.label}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400" />
            {lease.unit?.property?.address}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/70 bg-white/55 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" /> Start
              </p>
              <p className="mt-1 font-semibold text-slate-900">{new Date(lease.startDate).toLocaleDateString()}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/55 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" /> End
              </p>
              <p className="mt-1 font-semibold text-slate-900">{new Date(lease.endDate).toLocaleDateString()}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/55 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <DollarSign className="h-3.5 w-3.5" /> Monthly rent
              </p>
              <p className="mt-1 font-semibold text-slate-900">${lease.monthlyRent}</p>
            </div>
          </div>
        </section>
      ) : (
        <Alert tone="blue">No active lease on file yet. Your landlord will set it up.</Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard icon={Wallet} label="Outstanding" value={`$${outstanding.toFixed(2)}`} tone={outstanding ? "red" : "green"} />
        <StatCard icon={Wrench} label="Open requests" value={data?.openMaintenance ?? 0} tone="amber" />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Payments</h2>
        {payments.length === 0 ? (
          <EmptyState icon={Wallet} title="No payments yet" description="Rent invoices will appear here." />
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p._id} className="glass-card flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm">
                <span className="text-slate-700">
                  ${p.amount.toFixed(2)} <span className="text-slate-400">due</span>{" "}
                  {new Date(p.dueDate).toLocaleDateString()}
                </span>
                <Badge tone={p.status === "paid" ? "green" : p.status === "late" ? "red" : "amber"}>{p.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Maintenance requests</h2>
        {requests.length === 0 ? (
          <EmptyState icon={Wrench} title="Nothing reported" description="Report an issue and track it here." />
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r._id} className="glass-card flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm">
                <span className="text-slate-700">{r.title}</span>
                <Badge tone={r.status === "resolved" ? "green" : r.status === "in_progress" ? "blue" : "amber"}>
                  {r.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
