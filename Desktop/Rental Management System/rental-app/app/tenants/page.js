"use client";
import { useEffect, useState } from "react";

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [err, setErr] = useState("");

  const load = () =>
    fetch("/api/tenants").then(r => r.json()).then(setTenants);

  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setErr((await res.json()).error || "Failed"); return; }
    setForm({ name: "", email: "", phone: "" });
    load();
  };

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Tenants</h1>

      <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className="border rounded px-3 py-2" placeholder="Name"
          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input className="border rounded px-3 py-2" placeholder="Email" type="email"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input className="border rounded px-3 py-2" placeholder="Phone"
          value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
          Add tenant
        </button>
      </form>
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="bg-white border rounded divide-y">
        {tenants.length === 0 && <p className="p-4 text-gray-500">No tenants yet.</p>}
        {tenants.map(t => (
          <div key={t._id} className="p-4 hover:bg-gray-50">
            <p className="font-medium">{t.name}</p>
            <p className="text-sm text-gray-500">{t.email}{t.phone ? ` · ${t.phone}` : ""}</p>
          </div>
        ))}
      </div>
    </main>
  );
}