"use client";
import { useEffect, useState } from "react";

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

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (error) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-bold">My Lease</h1>
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      </main>
    );
  }

  const lease = data?.lease;
  const unpaid = payments.filter((p) => p.status !== "paid");

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">My Lease</h1>

      {lease ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Property</p>
          <p className="text-lg font-semibold">
            {lease.unit?.property?.name} · {lease.unit?.label}
          </p>
          <p className="text-sm text-gray-600">{lease.unit?.property?.address}</p>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-gray-500">Start</p>
              <p className="font-medium">{new Date(lease.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500">End</p>
              <p className="font-medium">{new Date(lease.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Monthly rent</p>
              <p className="font-medium">${lease.monthlyRent}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-gray-200 bg-white p-5 text-gray-600">
          No active lease on file yet.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Payments</h2>
        {payments.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white p-4 text-gray-600">No payments yet.</p>
        ) : (
          <div className="divide-y rounded-xl border border-gray-200 bg-white">
            {payments.map((p) => (
              <div key={p._id} className="flex items-center justify-between p-4 text-sm">
                <span>${p.amount.toFixed(2)} due {new Date(p.dueDate).toLocaleDateString()}</span>
                <span className={p.status === "paid" ? "text-green-600" : "text-yellow-600"}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
        {unpaid.length > 0 && (
          <p className="text-sm text-gray-600">
            ${unpaid.reduce((s, p) => s + p.amount, 0).toFixed(2)} outstanding across {unpaid.length} invoice
            {unpaid.length === 1 ? "" : "s"}.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Maintenance requests</h2>
        {requests.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white p-4 text-gray-600">Nothing reported.</p>
        ) : (
          <div className="divide-y rounded-xl border border-gray-200 bg-white">
            {requests.map((r) => (
              <div key={r._id} className="flex items-center justify-between p-4 text-sm">
                <span>{r.title}</span>
                <span className="text-gray-500">{r.status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
