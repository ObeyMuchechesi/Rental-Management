"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const statusStyles = {
  open: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};

export default function MaintenancePage() {
  const { data: session } = useSession();
  const isLandlord = session?.user?.role === "landlord";
  const [requests, setRequests] = useState([]);
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({ unit: "", title: "", description: "", priority: "medium" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/maintenance");
    const data = await res.json();
    if (res.ok) setRequests(data);
    else setError(data.error || "Failed to load requests");
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (isLandlord) {
      fetch("/api/units")
        .then((r) => (r.ok ? r.json() : []))
        .then(setUnits);
    }
  }, [isLandlord]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not submit request");
    setForm({ unit: "", title: "", description: "", priority: "medium" });
    load();
  };

  const setStatus = async (id, status) => {
    const res = await fetch("/api/maintenance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) setError((await res.json()).error || "Could not update request");
    else load();
  };

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">{isLandlord ? "Maintenance" : "My Requests"}</h1>

      <form onSubmit={submit} className="grid gap-2 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4">
        {isLandlord && (
          <select
            className="rounded border px-3 py-2"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            required
          >
            <option value="">Unit…</option>
            {units.map((u) => (
              <option key={u._id} value={u._id}>
                {u.label}
              </option>
            ))}
          </select>
        )}
        <input
          className="rounded border px-3 py-2"
          placeholder="Issue title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select
          className="rounded border px-3 py-2"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 md:col-span-4">
          Submit request
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-5 text-gray-600">No maintenance requests yet.</p>
      ) : (
        <div className="divide-y rounded-xl border border-gray-200 bg-white">
          {requests.map((r) => (
            <div key={r._id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-gray-500">
                  {r.unit?.label ? `${r.unit.label} · ` : ""}
                  {r.tenant?.name ? `${r.tenant.name} · ` : ""}
                  {r.priority} priority
                </p>
                {r.description && <p className="mt-1 text-sm text-gray-600">{r.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-0.5 text-xs ${statusStyles[r.status]}`}>
                  {r.status.replace("_", " ")}
                </span>
                {isLandlord && r.status !== "resolved" && (
                  <select
                    className="rounded border px-2 py-1 text-sm"
                    value={r.status}
                    onChange={(e) => setStatus(r._id, e.target.value)}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
