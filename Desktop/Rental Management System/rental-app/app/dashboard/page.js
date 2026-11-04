"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

function Card({ label, value, tone = "gray" }) {
  const tones = {
    gray: "text-gray-900",
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    blue: "text-blue-600",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
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
      <main className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  if (data.role === "tenant") {
    return (
      <main className="space-y-6">
        <h1 className="text-2xl font-bold">My Dashboard</h1>

        {data.lease ? (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Current lease</p>
            <p className="mt-1 text-lg font-semibold">
              {data.lease.unit?.property?.name} · {data.lease.unit?.label}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(data.lease.startDate).toLocaleDateString()} →{" "}
              {new Date(data.lease.endDate).toLocaleDateString()} · ${data.lease.monthlyRent}/mo
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-gray-200 bg-white p-5 text-gray-600">
            You don&apos;t have an active lease yet. Your landlord will set one up.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card label="Outstanding" value={`$${data.outstanding.toFixed(2)}`} tone={data.outstanding ? "red" : "green"} />
          <Card
            label="Next payment due"
            value={data.nextPayment ? new Date(data.nextPayment.dueDate).toLocaleDateString() : "—"}
            tone="blue"
          />
          <Card label="Open requests" value={data.openMaintenance} tone="yellow" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/payments" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            View payments
          </Link>
          <Link href="/maintenance" className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
            Maintenance requests
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

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
        <Link href="/properties" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Manage properties
        </Link>
        <Link href="/leases" className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          Create a lease
        </Link>
      </div>
    </main>
  );
}
