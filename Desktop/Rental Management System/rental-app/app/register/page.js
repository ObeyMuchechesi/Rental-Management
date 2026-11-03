"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("landlord");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Registration failed");
    else router.push("/dashboard");
  };

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto mt-16 space-y-3 bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold">Register</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input className="w-full border rounded px-3 py-2" placeholder="Name"
        value={name} onChange={e => setName(e.target.value)} required />
      <input className="w-full border rounded px-3 py-2" placeholder="Email"
        value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" className="w-full border rounded px-3 py-2" placeholder="Password"
        value={password} onChange={e => setPassword(e.target.value)} required />
      <select className="w-full border rounded px-3 py-2" value={role} onChange={e => setRole(e.target.value)}>
        <option value="landlord">I'm a Landlord</option>
        <option value="tenant">I'm a Tenant</option>
      </select>
      <button className="w-full bg-blue-600 text-white py-2 rounded">Create account</button>
    </form>
  );
}