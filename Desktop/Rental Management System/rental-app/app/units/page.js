"use client";
import { useEffect, useState } from "react";

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ property: "", label: "", rentAmount: "", bedrooms: "", bathrooms: "" });

  const load = async () => {
    const [u, p] = await Promise.all([
      fetch("/api/units").then(r => r.json()),
      fetch("/api/properties").then(r => r.json()),
    ]);
    setUnits(u); setProperties(p);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rentAmount: Number(form.rentAmount), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms) }),
    });
    setForm({ property: "", label: "", rentAmount: "", bedrooms: "", bathrooms: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Units</h1>
      <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-white p-4 rounded border">
        <select className="border rounded px-2 py-2 col-span-2" value={form.property}
          onChange={e => setForm({ ...form, property: e.target.value })} required>
          <option value="">Property…</option>
          {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <input className="border rounded px-2 py-2" placeholder="Label"
          value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required />
        <input className="border rounded px-2 py-2" placeholder="Rent" type="number"
          value={form.rentAmount} onChange={e => setForm({ ...form, rentAmount: e.target.value })} required />
        <input className="border rounded px-2 py-2" placeholder="Beds" type="number"
          value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} />
        <button className="bg-blue-600 text-white rounded px-3">Add</button>
      </form>

      <div className="grid md:grid-cols-3 gap-3">
        {units.map(u => (
          <div key={u._id} className="bg-white border rounded p-4">
            <div className="flex justify-between items-center">
              <p className="font-medium">{u.label}</p>
              <span className={`text-xs px-2 py-0.5 rounded ${u.status === "occupied" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{u.status}</span>
            </div>
            <p className="text-sm text-gray-500">{u.property?.name}</p>
            <p className="text-sm mt-1">$ {u.rentAmount}/mo</p>
          </div>
        ))}
      </div>
    </div>
  );
}