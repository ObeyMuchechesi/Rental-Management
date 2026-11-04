"use client";
import { useEffect, useState } from "react";

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ name: "", address: "", type: "apartment" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/properties");
    const data = await res.json();
    if (res.ok) setProperties(data);
    else setError(data.error || "Failed to load properties");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not add property");
    setForm({ name: "", address: "", type: "apartment" });
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this property and all of its units, leases and payments?")) return;
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (!res.ok) setError((await res.json()).error || "Could not delete property");
    else load();
  };

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Properties</h1>

      <form onSubmit={add} className="grid gap-2 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4">
        <input
          className="rounded border px-3 py-2"
          placeholder="Property name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          required
        />
        <select
          className="rounded border px-3 py-2"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="commercial">Commercial</option>
        </select>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Add property</button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : properties.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-5 text-gray-600">
          No properties yet. Add your first one above.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {properties.map((p) => (
            <div key={p._id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-gray-500">{p.address}</p>
                </div>
                <button onClick={() => remove(p._id)} className="text-sm text-red-600 hover:underline">
                  Delete
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-600 capitalize">
                {p.type} · {p.occupiedCount}/{p.unitCount} units occupied
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
