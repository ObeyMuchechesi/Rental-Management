"use client";
import { useEffect, useState } from "react";

export default function LeasesPage() {
  const [leases, setLeases] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ unit: "", tenant: "", startDate: "", endDate: "", monthlyRent: "", deposit: "" });

  const load = async () => {
    const [l, u, t] = await Promise.all([
      fetch("/api/leases").then(r => r.json()),
      fetch("/api/units").then(r => r.json()),
      fetch("/api/tenants").then(r => r.json()),
    ]);
    setLeases(l); setUnits(u); setTenants(t);
  };
  useEffect(() => { load(); }, []);

  const availableUnits = units.filter(u => u.status === "vacant");

  const submit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/leases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        monthlyRent: Number(form.monthlyRent),
        deposit: Number(form.deposit || 0),
        status: "active",
      }),
    });
    if (!res.ok) { alert((await res.json()).error); return; }
    setForm({ unit: "", tenant: "", startDate: "", endDate: "", monthlyRent: "", deposit: "" });
    load();
  };

  const endLease = async (id) => {
    await fetch(`/api/leases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ended" }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leases</h1>

      <form onSubmit={submit} className="grid md:grid-cols-6 gap-2 bg-white p-4 rounded border">
        <select className="border rounded px-2 py-2" value={form.unit}
          onChange={e => {
            const u = units.find(x => x._id === e.target.value);
            setForm({ ...form, unit: e.target.value, monthlyRent: u?.rentAmount ?? form.monthlyRent });
          }} required>
          <option value="">Vacant unit…</option>
          {availableUnits.map(u => <option key={u._id} value={u._id}>{u.label} — $ {u.rentAmount}</option>)}
        </select>
        <select className="border rounded px-2 py-2" value={form.tenant}
          onChange={e => setForm({ ...form, tenant: e.target.value })} required>
          <option value="">Tenant…</option>
          {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <input type="date" className="border rounded px-2 py-2" value={form.startDate}
          onChange={e => setForm({ ...form, startDate: e.target.value })} required />
        <input type="date" className="border rounded px-2 py-2" value={form.endDate}
          onChange={e => setForm({ ...form, endDate: e.target.value })} required />
        <input className="border rounded px-2 py-2" placeholder="Rent" type="number" value={form.monthlyRent}
          onChange={e => setForm({ ...form, monthlyRent: e.target.value })} required />
        <button className="bg-blue-600 text-white rounded px-3">Create</button>
      </form>

      <div className="bg-white border rounded divide-y">
        {leases.map(l => (
          <div key={l._id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{l.unit?.label} · {l.tenant?.name}</p>
              <p className="text-sm text-gray-500">
                {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()} · $ {l.monthlyRent}/mo
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded ${l.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{l.status}</span>
              {l.status === "active" && (
                <button onClick={() => endLease(l._id)} className="text-sm text-red-600">End</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}