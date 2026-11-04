"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  DoorOpen,
  Percent,
  ScrollText,
  Wrench,
  AlertTriangle,
  Wallet,
  TrendingUp,
  CalendarClock,
  ArrowRight,
  CircleCheck,
  KeyRound,
} from "lucide-react";
import { Alert, Badge, Loading, PageHeader, StatCard, btnGhost, btnPrimary } from "@/app/components/ui";

function PageBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Image src="/house.jpg" alt="" fill sizes="100vw" className="object-cover" priority />
      <div className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/78 to-white/90" />
    </div>
  );
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
      <main className="space-y-5 pb-10">
        <PageBackdrop />
        <PageHeader title="Dashboard" subtitle="Occupancy, rent and maintenance at a glance." icon={Building2} />
        <Alert>{error}</Alert>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="space-y-5 pb-10">
        <PageBackdrop />
        <PageHeader title="Dashboard" subtitle="Occupancy, rent and maintenance at a glance." icon={Building2} />
        <Loading label="Loading your portfolio…" />
      </main>
    );
  }

  if (data.role === "tenant") {
    return (
      <main className="space-y-5 pb-10">
        <PageBackdrop />
        <PageHeader
          eyebrow="Tenant portal"
          title="My dashboard"
          subtitle="Your lease, rent and maintenance in one place."
          icon={KeyRound}
          actions={
            <Badge tone="green">
              <CircleCheck className="h-3.5 w-3.5" /> Approved tenant
            </Badge>
          }
        />

        {data.lease ? (
          <section className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Current lease</p>
                <p className="mt-1.5 text-lg font-semibold text-slate-900">
                  {data.lease.unit?.property?.name} · {data.lease.unit?.label}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  {new Date(data.lease.startDate).toLocaleDateString()} →{" "}
                  {new Date(data.lease.endDate).toLocaleDateString()}
                  <span className="text-slate-400">·</span>${data.lease.monthlyRent}/mo
                </p>
              </div>
              <Badge tone="green">
                <CircleCheck className="h-3.5 w-3.5" /> Active
              </Badge>
            </div>
          </section>
        ) : (
          <Alert tone="blue">You don&apos;t have an active lease yet. Your landlord will set one up.</Alert>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            icon={Wallet}
            label="Outstanding"
            value={`$${data.outstanding.toFixed(2)}`}
            tone={data.outstanding ? "red" : "green"}
          />
          <StatCard
            icon={CalendarClock}
            label="Next payment due"
            value={data.nextPayment ? new Date(data.nextPayment.dueDate).toLocaleDateString() : "—"}
            tone="blue"
          />
          <StatCard icon={Wrench} label="Open requests" value={data.openMaintenance} tone="amber" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/payments" className={btnPrimary}>
            View payments <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/maintenance" className={btnGhost}>
            Maintenance requests
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-5 pb-10">
      <PageBackdrop />

      <PageHeader
        eyebrow="Portfolio overview"
        title="Dashboard"
        subtitle="Occupancy, rent and maintenance at a glance."
        icon={Building2}
        actions={
          <>
            <Badge tone="blue">
              <Percent className="h-3.5 w-3.5" />
              {data.occupancyRate}% occupied
            </Badge>
            <Link href="/approvals" className={btnGhost}>
              Approvals
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Building2} label="Properties" value={data.totalProperties} tone="blue" />
        <StatCard icon={DoorOpen} label="Total units" value={data.totalUnits} />
        <StatCard icon={CircleCheck} label="Occupied" value={data.occupied} tone="green" />
        <StatCard icon={AlertTriangle} label="Vacant" value={data.vacant} tone="red" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Percent} label="Occupancy rate" value={`${data.occupancyRate}%`} tone="blue" />
        <StatCard icon={ScrollText} label="Active leases" value={data.activeLeases} />
        <StatCard icon={Wrench} label="Open maintenance" value={data.openMaintenance} tone="amber" />
        <StatCard icon={AlertTriangle} label="Overdue payments" value={data.overdue} tone={data.overdue ? "red" : "green"} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          icon={TrendingUp}
          label="Collected this month"
          value={`$${data.collectedThisMonth.toFixed(2)}`}
          tone="green"
        />
        <StatCard icon={Wallet} label="Outstanding" value={`$${data.outstanding.toFixed(2)}`} tone="red" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/properties" className={btnPrimary}>
          Manage properties <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/leases" className={btnGhost}>
          Create a lease
        </Link>
      </div>
    </main>
  );
}
