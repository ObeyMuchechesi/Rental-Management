"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) return setError("Invalid email or password");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto mt-16 space-y-3 bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold">Sign in</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input className="w-full border rounded px-3 py-2" placeholder="Email"
        value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" className="w-full border rounded px-3 py-2" placeholder="Password"
        value={password} onChange={e => setPassword(e.target.value)} required />
      <button className="w-full bg-blue-600 text-white py-2 rounded">Sign in</button>
    </form>
  );
}