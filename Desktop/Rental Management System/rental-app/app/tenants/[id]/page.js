"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  UserCheck,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Building2,
  DoorOpen,
  CalendarDays,
  DollarSign,
  Wallet,
  Wrench,
  CircleSlash,
  Link2,
  UserRound,
} from "lucide-react";
import {
  Alert,
  Badge,
  Loading,
  PageHeader,
  StatCard,
  btnDanger,
  btnGhost,
  btnPrimary,
  inputClass,
} from "@/app/components/ui";

const accountTone = { approved: "green", pending: "amber", rejected: "red", none: "slate" };

export default function TenantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const [assign, setAssign] = useState({ unit: "", startDate: today, endDate: "", monthlyRent: "" });

  const load = useCallback(async () => {
    const res = await fetch(`/api/tenants/${id}`);
    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error || "Could not load this tenant");
      return;
    }
    setData(payload);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const endLease = async () => {
    if (!confirm("End this lease and mark the unit vacant?")) return;
    setBusy("end");
    const res = await fetch(`/api/leases/${data.activeLease._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ended" }),
    });
    setBusy("");
    if (!res.ok) return setError((await res.json()).error || "Could not end the lease");
    setNotice("Lease ended and the unit is vacant again.");
    load();
  };

  const assignUnit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy("assign");
    const res = await fetch("/api/leases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit: assign.unit,
        tenant: id,
        startDate: assign.startDate,
        endDate: assign.endDate,
        monthlyRent: Number(assign.monthlyRent),
        status: "active",
      }),
    });
    const payload = await res.json();
    setBusy("");
    if (!res.ok) return setError(payload.error || "Could not assign the unit");
    setNotice("Unit assigned — it is now marked occupied and invoices were generated.");
    setAssign({ unit: "", startDate: today, endDate: "", monthlyRent: "" });
    load();
  };

  const deleteTenant = async () => {
    const ok = confirm(
      `Delete ${data.tenant.name}?\n\nThis removes their login account, leases, rent invoices and maintenance requests, and frees any unit they occupy. It cannot be undone.`,
    );
    if (!ok) return;
    setBusy("delete");
    const res = await fetch(`/api/tenants/${id}`, { method: "DELETE" });
    setBusy("");
    if (!res.ok) return setError((await res.json()).error || "Could not delete this tenant");
    router.push("/tenants");
    router.refresh();
  };

  if (!data) {
    return (
      <main className="space-y-5 pb-10">
        <PageHeader title="Tenant" icon={UserRound} actions={<Link href="/tenants" className={btnGhost}><ArrowLeft className="h-4 w-4" /> All tenants</Link>} />
        {error ? <Alert>{error}</Alert> : <Loading label="Loading tenant…" />}
      </main>
    );
  }

  const { tenant, account, activeLease, summary, units } = data;
  const vacant = units.filter((u) => u.status === "vacant");

  return (
    <main className="space-y-5 pb-10">
      <PageHeader
        eyebrow="Tenant record"
        title={tenant.name}
        subtitle={`${tenant.email}${tenant.phone ? ` · ${tenant.phone}` : ""}`}
        icon={UserRound}
        actions={
          <>
            <Badge tone={accountTone[account?.status || "none"]}>
              {account ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" /> account {account.status || "approved"}
                </>
              ) : (
                <>
                  <ShieldOff className="h-3.5 w-3.5" /> no account
                </>
              )}
            </Badge>
            <Link href="/tenants" className={btnGhost}>
              <ArrowLeft className="h-4 w-4" /> All tenants
            </Link>
          </>
        }
      />

      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="green">{notice}</Alert>}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="glass-card rounded-2xl p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Contact</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex items-center gap-2 break-all text-slate-700">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" /> {tenant.email}
            </p>
            <p className="flex items-center gap-2 text-slate-700">
              <Phone className="h-4 w-4 shrink-0 text-slate-400" /> {tenant.phone || "—"}
            </p>
            <p className="flex items-center gap-2 text-slate-700">
              <UserCheck className="h-4 w-4 shrink-0 text-slate-400" />
              {account ? `Account ${account.status || "approved"}` : "No login account linked"}
            </p>
            <p className="flex items-center gap-2 text-slate-700">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
              Added {new Date(tenant.createdAt).toLocaleDateString()}
            </p>
          </div>

          {account?.status === "pending" && (
            <Link href="/approvals" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:underline">
              Review in approvals →
            </Link>
          )}
        </section>

        <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
          <StatCard icon={Wallet} label="Paid" value={`$${summary.paid.toFixed(2)}`} tone="green" />
          <StatCard icon={DollarSign} label="Outstanding" value={`$${summary.outstanding.toFixed(2)}`} tone={summary.outstanding ? "red" : "green"} />
          <StatCard icon={Wrench} label="Open requests" value={summary.openMaintenance} tone="amber" />
        </div>
      </div>

      <section className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Current lease</h2>
        {activeLease ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                <Building2 className="h-4 w-4 text-slate-400" />
                {activeLease.unit?.property?.name || "Property"}
                <span className="text-slate-300">/</span>
                <DoorOpen className="h-4 w-4 text-slate-400" />
                {activeLease.unit?.label}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(activeLease.startDate).toLocaleDateString()} → {new Date(activeLease.endDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" /> {activeLease.monthlyRent}/mo
                </span>
              </p>
            </div>
            <button onClick={endLease} disabled={busy === "end"} className={btnGhost}>
              <CircleSlash className="h-4 w-4" /> {busy === "end" ? "Ending…" : "End lease & vacate"}
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            No active lease. Assign a vacant unit below to put this tenant into a property.
          </p>
        )}
      </section>

      {!activeLease && (
        <form onSubmit={assignUnit} className="glass-card rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            <Link2 className="h-4 w-4" /> Assign a property unit
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Assigning a vacant unit makes it occupied and issues this tenant&apos;s rent invoices.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <select
              className={`${inputClass} sm:col-span-2`}
              value={assign.unit}
              onChange={(e) => {
                const picked = vacant.find((u) => u._id === e.target.value);
                setAssign({ ...assign, unit: e.target.value, monthlyRent: picked?.rentAmount ?? "" });
              }}
              required
            >
              <option value="">Vacant unit…</option>
              {vacant.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.property ? `${u.property} · ${u.label}` : u.label} — ${u.rentAmount}/mo
                </option>
              ))}
            </select>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Start
              <input type="date" className={`${inputClass} mt-1`} value={assign.startDate} onChange={(e) => setAssign({ ...assign, startDate: e.target.value })} required />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              End
              <input type="date" className={`${inputClass} mt-1`} value={assign.endDate} onChange={(e) => setAssign({ ...assign, endDate: e.target.value })} required />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Rent / month
              <input type="number" min="0" className={`${inputClass} mt-1`} value={assign.monthlyRent} onChange={(e) => setAssign({ ...assign, monthlyRent: e.target.value })} required />
            </label>
          </div>
          <div className="mt-4">
            <button className={btnPrimary} disabled={busy === "assign" || vacant.length === 0}>
              <Link2 className="h-4 w-4" />
              {busy === "assign" ? "Assigning…" : vacant.length ? "Assign unit" : "No vacant units"}
            </button>
          </div>
        </form>
      )}

      <section className="glass-card rounded-2xl border border-red-200/70 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-red-600">Danger zone</h2>
        <p className="mt-1 text-sm text-slate-600">
          Deleting this tenant removes their login account, every lease, invoice and maintenance request, and frees the
          unit they occupy.
        </p>
        <button onClick={deleteTenant} disabled={busy === "delete"} className={`${btnDanger} mt-3`}>
          <Trash2 className="h-4 w-4" /> {busy === "delete" ? "Deleting…" : "Delete tenant account"}
        </button>
      </section>
    </main>
  );
}
