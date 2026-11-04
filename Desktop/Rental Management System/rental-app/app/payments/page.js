"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const badge = (status) =>
  status === "paid"
    ? "bg-green-100 text-green-700"
    : new Date(status) && status === "late"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/payments");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to load payments");
    else setPayments(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id, status) => {
    setError("");
    const res = await fetch(`/api/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) setError((await res.json()).error || "Could not update payment");
    else load();
  };

  const isLandlord = session?.user?.role === "landlord";
  const paid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">{isLandlord ? "Payments" : "My Payments"}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-green-600">${paid.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-2xl font-bold text-red-600">${pending.toFixed(2)}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-5 text-gray-600">No payments recorded yet.</p>
      ) : (
        <div className="divide-y rounded-xl border border-gray-200 bg-white">
          {payments.map((p) => (
            <div key={p._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">
                  ${p.amount.toFixed(2)}
                  {isLandlord && p.lease?.tenant?.name ? ` · ${p.lease.tenant.name}` : ""}
                  {p.lease?.unit?.label ? ` · ${p.lease.unit.label}` : ""}
                </p>
                <p className="text-sm text-gray-500">
                  Due {new Date(p.dueDate).toLocaleDateString()}
                  {p.paidDate ? ` · paid ${new Date(p.paidDate).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-0.5 text-xs ${badge(p.status)}`}>{p.status}</span>
                {p.status !== "paid" ? (
                  <button
                    onClick={() => setStatus(p._id, "paid")}
                    className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                  >
                    Mark paid
                  </button>
                ) : (
                  <button onClick={() => setStatus(p._id, "pending")} className="text-sm text-gray-500 hover:underline">
                    Undo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
