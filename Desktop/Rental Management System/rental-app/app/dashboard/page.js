"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

function Card({ label, value, tone = "gray" }) {
  const tones = {
    gray: "text-slate-900",
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-amber-600",
    blue: "text-blue-600",
  };
  return (
    <div className="glass-card lift rounded-2xl p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function Shell({ children }) {
  return <main className="space-y-6 pb-10">{children}</main>;
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Failed to load dashboard");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="rounded-xl border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-700 backdrop-blur">
          {error}
        </p>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="glass-card rounded-2xl p-5 text-sm text-slate-500">Loading…</p>
      </Shell>
    );
  }

  if (data.role === "tenant") {
    return (
      <Shell>
        <div className="glass relative overflow-hidden rounded-[1.75rem] p-6 md:p-7">
          <div className="absolute inset-0 -z-10">
            <Image
              src="/house.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/60 to-white/20" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">Tenant portal</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">My Dashboard</h1>
        </div>

        {data.lease ? (
          <div className="glass rounded-2xl p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Current lease</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {data.lease.unit?.property?.name} · {data.lease.unit?.label}
            </p>
            <p className="text-sm text-slate-600">
              {new Date(data.lease.startDate).toLocaleDateString()} →{" "}
              {new Date(data.lease.endDate).toLocaleDateString()} · ${data.lease.monthlyRent}/mo
            </p>
          </div>
        ) : (
          <p className="glass rounded-2xl p-6 text-slate-600">
            You don&apos;t have an active lease yet. Your landlord will set one up.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card
            label="Outstanding"
            value={`$${data.outstanding.toFixed(2)}`}
            tone={data.outstanding ? "red" : "green"}
          />
          <Card
            label="Next payment due"
            value={data.nextPayment ? new Date(data.nextPayment.dueDate).toLocaleDateString() : "—"}
            tone="blue"
          />
          <Card label="Open requests" value={data.openMaintenance} tone="yellow" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/payments"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            View payments
          </Link>
          <Link
            href="/maintenance"
            className="glass-soft rounded-xl px-5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-white/70"
          >
            Maintenance requests
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="glass relative overflow-hidden rounded-[1.75rem] p-6 md:p-7">
        <div className="absolute inset-0 -z-10">
          <Image src="/house.jpg" alt="" fill sizes="100vw" className="object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/65 to-white/20" />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">Portfolio overview</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Occupancy, rent and maintenance at a glance.</p>
          </div>
          <span className="glass-soft rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700">
            {data.occupancyRate}% occupied
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Properties" value={data.totalProperties} />
        <Card label="Total units" value={data.totalUnits} />
        <Card label="Occupied" value={data.occupied} tone="green" />
        <Card label="Vacant" value={data.vacant} tone="red" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Occupancy rate" value={`${data.occupancyRate}%`} tone="blue" />
        <Card label="Active leases" value={data.activeLeases} />
        <Card label="Open maintenance" value={data.openMaintenance} tone="yellow" />
        <Card label="Overdue payments" value={data.overdue} tone={data.overdue ? "red" : "green"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card label="Collected this month" value={`$${data.collectedThisMonth.toFixed(2)}`} tone="green" />
        <Card label="Outstanding" value={`$${data.outstanding.toFixed(2)}`} tone="red" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/properties"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          Manage properties
        </Link>
        <Link
          href="/leases"
          className="glass-soft rounded-xl px-5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-white/70"
        >
          Create a lease
        </Link>
      </div>
    </Shell>
  );
}
