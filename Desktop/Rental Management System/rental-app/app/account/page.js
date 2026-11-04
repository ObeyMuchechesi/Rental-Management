"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, KeyRound, Save, LogOut } from "lucide-react";
import {
  Alert,
  Loading,
  PageHeader,
  Badge,
  btnGhost,
  btnPrimary,
  inputClass,
} from "@/app/components/ui";

export default function AccountPage() {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reveal, setReveal] = useState(false);

  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState("");

  const load = async () => {
    const res = await fetch("/api/account");
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not load your account");
    setAccount(data);
    setEmail(data.email);
  };

  useEffect(() => {
    load();
  }, []);

  const saveEmail = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setSaving("email");
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, currentPassword: emailPassword }),
    });
    const data = await res.json();
    setSaving("");
    if (!res.ok) return setError(data.error || "Could not update email");
    setEmailPassword("");
    if (data.emailChanged) {
      setNotice("Email updated. Sign out and back in with the new address.");
    } else {
      setAccount({ ...account, email: data.email });
      setNotice("That is already your current email.");
    }
    setAccount((a) => ({ ...a, email: data.email, password: data.password }));
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (next !== confirm) return setError("The new passwords do not match");
    setSaving("password");
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    setSaving("");
    if (!res.ok) return setError(data.error || "Could not update password");
    setCurrent("");
    setNext("");
    setConfirm("");
    setAccount((a) => ({ ...a, password: data.password }));
    setNotice("Password updated. Use it the next time you sign in.");
  };

  if (!account) {
    return (
      <main className="space-y-6">
        <PageHeader eyebrow="Settings" title="Account" subtitle="Your sign-in details." icon={ShieldCheck} />
        {error ? <Alert>{error}</Alert> : <Loading label="Loading account…" />}
      </main>
    );
  }

  return (
    <main className="space-y-5 pb-10">
      <PageHeader
        eyebrow="Settings"
        title="Account & credentials"
        subtitle="View the credentials in use and update the email or password at any time."
        icon={ShieldCheck}
        actions={
          <Badge tone="blue">
            <ShieldCheck className="h-3.5 w-3.5" />
            {account.role === "landlord" ? "Landlord admin" : "Tenant"}
          </Badge>
        }
      />

      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="green">{notice}</Alert>}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* current details */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Current credentials</h2>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-white/70 bg-white/55 p-3.5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                <Mail className="h-3.5 w-3.5" /> Email address
              </div>
              <p className="mt-1 break-all text-sm font-semibold text-slate-900">{account.email}</p>
            </div>

            <div className="rounded-xl border border-white/70 bg-white/55 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <Lock className="h-3.5 w-3.5" /> Password
                </div>
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-500/10"
                >
                  {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {reveal ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
                {account.password ? (reveal ? account.password : "•".repeat(Math.max(account.password.length, 8))) : "Not stored yet"}
              </p>
              {!account.password && (
                <p className="mt-1 text-xs text-slate-500">
                  Set a new password below and it will be stored so it can be shown here.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* change email */}
        <form onSubmit={saveEmail} className="glass-card rounded-2xl p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            <Mail className="h-4 w-4" /> Change email
          </h2>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              New email address
              <input
                type="email"
                className={`${inputClass} mt-1.5`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Current password
              <input
                type="password"
                className={`${inputClass} mt-1.5`}
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="Confirm it's you"
                required
                autoComplete="current-password"
              />
            </label>
            <button className={btnPrimary} disabled={saving === "email"}>
              <Save className="h-4 w-4" />
              {saving === "email" ? "Saving…" : "Update email"}
            </button>
          </div>
        </form>
      </div>

      {/* change password */}
      <form onSubmit={savePassword} className="glass-card rounded-2xl p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
          <KeyRound className="h-4 w-4" /> Change password
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="block text-sm font-medium text-slate-700">
            Current password
            <input
              type="password"
              className={`${inputClass} mt-1.5`}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            New password
            <input
              type="password"
              className={`${inputClass} mt-1.5`}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Confirm new password
            <input
              type="password"
              className={`${inputClass} mt-1.5`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className={btnPrimary} disabled={saving === "password"}>
            <Save className="h-4 w-4" />
            {saving === "password" ? "Saving…" : "Update password"}
          </button>
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className={btnGhost}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Passwords are stored as a hash for sign-in and an encrypted copy so this page can show them.
        </p>
      </form>
    </main>
  );
}
