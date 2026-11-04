"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowRight, ShieldCheck, Clock, XCircle } from "lucide-react";
import { Alert, btnPrimary, inputClass } from "@/app/components/ui";

const errorFor = (res) => {
  if (res?.code === "pending") {
    return "Your account is waiting for the landlord to approve it. Try again once it has been approved.";
  }
  if (res?.code === "rejected") {
    return "This account request was declined by the landlord.";
  }
  return "That email and password do not match an account.";
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setCode("");
    setBusy(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setBusy(false);
      setCode(res.code || "");
      return setError(errorFor(res));
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="mx-auto grid max-w-5xl items-stretch gap-6 py-6 md:grid-cols-2 md:py-12">
      <section className="relative hidden overflow-hidden rounded-3xl md:block">
        <Image src="/house.jpg" alt="Rental home at dusk" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-7 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Rental management</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight">Every door, lease and payment in one calm place.</h2>
          <p className="mt-2 max-w-sm text-sm text-white/75">
            Landlords manage the portfolio. Tenants sign in to see their lease, rent and requests.
          </p>
        </div>
      </section>

      <form onSubmit={submit} className="glass self-center rounded-3xl p-6 sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
          <ShieldCheck className="h-5 w-5" strokeWidth={2} />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Welcome back. Use the credentials for your account.</p>

        <div className="mt-5 space-y-3">
          {error && <Alert>{error}</Alert>}

          <label className="block text-sm font-medium text-slate-700">
            Email
            <span className="relative mt-1.5 block">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                className={`${inputClass} pl-10`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </span>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <span className="relative mt-1.5 block">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                className={`${inputClass} pl-10`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </span>
          </label>

          <button className={`${btnPrimary} w-full`} disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>

        {code === "pending" && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-3 text-xs text-amber-800">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            Ask the landlord to approve your registration, then sign in again.
          </p>
        )}

        <div className="mt-6 space-y-3 border-t border-white/70 pt-5 text-sm">
          <p className="text-slate-600">
            New tenant?{" "}
            <Link href="/register" className="font-semibold text-blue-700 hover:underline">
              Create an account
            </Link>{" "}
            — the landlord approves it before you can sign in.
          </p>
          <p className="flex items-start gap-2 rounded-xl bg-white/55 px-3.5 py-3 text-xs text-slate-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            Landlords do not register here. The landlord admin account is created by the system and signs in with the
            credentials provided to it.
          </p>
        </div>
      </form>
    </main>
  );
}
