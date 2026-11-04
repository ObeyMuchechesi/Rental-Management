"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Wallet, CircleCheck, Clock, Undo2, ReceiptText, CalendarDays } from "lucide-react";
import { Alert, Badge, EmptyState, Loading, PageHeader, StatCard, btnGhost, btnSmall } from "@/app/components/ui";

const statusTone = { paid: "green", pending: "amber", late: "red" };

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/payments");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to load payments");
    else setPayments(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id, status) => {
    setError("");
    setBusy(id);
    const res = await fetch(`/api/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy("");
    if (!res.ok) setError((await res.json()).error || "Could not update payment");
    else load();
  };

  const isLandlord = session?.user?.role === "landlord";
  const paid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <main className="space-y-5 pb-10">
      <PageHeader
        eyebrow="Money"
        title={isLandlord ? "Payments" : "My payments"}
        subtitle={isLandlord ? "Every rent invoice across your portfolio." : "Your rent invoices and what is still owed."}
        icon={Wallet}
        actions={<Badge tone="blue">{payments.length} invoices</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard icon={CircleCheck} label="Paid" value={`$${paid.toFixed(2)}`} tone="green" />
        <StatCard icon={Clock} label="Outstanding" value={`$${pending.toFixed(2)}`} tone={pending ? "red" : "green"} />
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading payments…" />
      ) : payments.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No payments recorded" description="Rent invoices appear here once a lease exists." />
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <article key={p._id} className="glass-card rounded-2xl p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-slate-900">${p.amount.toFixed(2)}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-600">
                    {isLandlord && p.lease?.tenant?.name ? `${p.lease.tenant.name} · ` : ""}
                    {p.lease?.unit?.property?.name ? `${p.lease.unit.property.name} · ` : ""}
                    {p.lease?.unit?.label || ""}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Due {new Date(p.dueDate).toLocaleDateString()}
                    {p.paidDate ? ` · paid ${new Date(p.paidDate).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone[p.status] || "slate"}>{p.status}</Badge>
                  {p.status !== "paid" ? (
                    <button
                      onClick={() => setStatus(p._id, "paid")}
                      disabled={busy === p._id}
                      className={`${btnSmall} bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700`}
                    >
                      <CircleCheck className="h-3.5 w-3.5" /> Mark paid
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(p._id, "pending")}
                      disabled={busy === p._id}
                      className={`${btnSmall} text-slate-500 hover:bg-white/70`}
                    >
                      <Undo2 className="h-3.5 w-3.5" /> Undo
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
