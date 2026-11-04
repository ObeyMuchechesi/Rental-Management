"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, Mail, Phone, Lock, ArrowRight, Clock, CheckCircle2, ShieldCheck } from "lucide-react";
import { Alert, btnPrimary, btnGhost, inputClass } from "@/app/components/ui";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("The two passwords do not match");
    setBusy(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Registration failed");
    setDone(true);
  };

  return (
    <main className="mx-auto grid max-w-5xl items-stretch gap-6 py-6 md:grid-cols-2 md:py-12">
      <section className="relative hidden overflow-hidden rounded-3xl md:block">
        <Image src="/home.jpg" alt="Family home with a pool" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-7 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Tenant registration</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight">Rent made simple.</h2>
          <p className="mt-2 max-w-sm text-sm text-white/75">
            Create your account, then track your lease, rent invoices and maintenance requests from one place.
          </p>
        </div>
      </section>

      {done ? (
        <section className="glass self-center rounded-3xl p-6 text-center sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Account created</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your registration is now waiting for the landlord to approve it. Once approved, sign in with{" "}
            <span className="font-semibold text-slate-900">{form.email}</span>.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/login" className={btnPrimary}>
              Go to sign in <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/" className={btnGhost}>
              Back to home
            </Link>
          </div>
        </section>
      ) : (
        <form onSubmit={submit} className="glass self-center rounded-3xl p-6 sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
            <User className="h-5 w-5" strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Create a tenant account</h1>
          <p className="mt-1 text-sm text-slate-600">
            Only tenants register. The landlord approves every new account before it can sign in.
          </p>

          <div className="mt-5 space-y-3">
            {error && <Alert>{error}</Alert>}

            <label className="block text-sm font-medium text-slate-700">
              Full name
              <span className="relative mt-1.5 block">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className={`${inputClass} pl-10`} placeholder="Alice Mwangi" value={form.name} onChange={set("name")} required />
              </span>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Email
              <span className="relative mt-1.5 block">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  className={`${inputClass} pl-10`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set("email")}
                  required
                  autoComplete="email"
                />
              </span>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Phone <span className="font-normal text-slate-400">(optional)</span>
              <span className="relative mt-1.5 block">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className={`${inputClass} pl-10`} placeholder="+254 700 000 000" value={form.phone} onChange={set("phone")} />
              </span>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Password
                <span className="relative mt-1.5 block">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    className={`${inputClass} pl-10`}
                    placeholder="6+ characters"
                    value={form.password}
                    onChange={set("password")}
                    minLength={6}
                    required
                    autoComplete="new-password"
                  />
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Confirm password
                <span className="relative mt-1.5 block">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    className={`${inputClass} pl-10`}
                    placeholder="Repeat it"
                    value={form.confirm}
                    onChange={set("confirm")}
                    minLength={6}
                    required
                    autoComplete="new-password"
                  />
                </span>
              </label>
            </div>

            <button className={`${btnPrimary} w-full`} disabled={busy}>
              {busy ? "Creating account…" : "Create account"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-5 space-y-2 border-t border-white/70 pt-4 text-sm text-slate-600">
            <p className="flex items-start gap-2 rounded-xl bg-amber-50/70 px-3.5 py-3 text-xs text-amber-800">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              Your account stays pending until the landlord approves it.
            </p>
            <p className="text-slate-600">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-blue-700 hover:underline">
                Sign in
              </Link>
            </p>
            <p className="flex items-start gap-2 text-xs text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              Landlords use the system admin account instead of registering.
            </p>
          </div>
        </form>
      )}
    </main>
  );
}
