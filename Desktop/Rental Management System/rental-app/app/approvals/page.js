"use client";

import { useEffect, useMemo, useState } from "react";
import { UserCheck, UserX, Clock, CheckCircle2, XCircle, Inbox, Mail } from "lucide-react";
import { Alert, Badge, EmptyState, Loading, PageHeader, btnGhost, btnPrimary, btnDanger } from "@/app/components/ui";

const tabs = [
  ["pending", "Pending", Clock],
  ["approved", "Approved", CheckCircle2],
  ["rejected", "Rejected", XCircle],
];

const statusTone = { pending: "amber", approved: "green", rejected: "red" };

export default function ApprovalsPage() {
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [tab, setTab] = useState("pending");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = async () => {
    const res = await fetch("/api/approvals");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load registrations");
      setLoading(false);
      return;
    }
    setUsers(data.users);
    setCounts(data.counts);
    setError("");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id, action) => {
    setBusy(id);
    const res = await fetch("/api/approvals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = await res.json();
    setBusy("");
    if (!res.ok) return setError(data.error || "Could not update the account");
    load();
  };

  const visible = useMemo(() => users.filter((u) => (u.status || "approved") === tab), [users, tab]);

  return (
    <main className="space-y-5 pb-10">
      <PageHeader
        eyebrow="Access control"
        title="Registration approvals"
        subtitle="Every tenant sign-up waits here until you approve it. Approved tenants can sign in and see their own lease."
        icon={UserCheck}
        actions={
          counts.pending > 0 ? (
            <Badge tone="amber">
              <Clock className="h-3.5 w-3.5" />
              {counts.pending} waiting
            </Badge>
          ) : (
            <Badge tone="green">
              <CheckCircle2 className="h-3.5 w-3.5" />
              All clear
            </Badge>
          )
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto sm:gap-2">
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={
              tab === key
                ? "inline-flex shrink-0 items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-white/80 sm:px-4"
                : "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/55 sm:px-4"
            }
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-xs font-bold text-slate-600">
              {counts[key] || 0}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <Loading label="Loading registrations…" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={tab === "pending" ? "No registrations waiting" : `No ${tab} accounts`}
          description={
            tab === "pending"
              ? "When a tenant signs up, their request appears here for your approval."
              : "Accounts you approve or reject will be listed here."
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((u) => (
            <article key={u._id} className="glass-card rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold uppercase text-white shadow-md shadow-blue-600/25">
                    {u.name?.slice(0, 1) || "?"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{u.name}</p>
                    <p className="flex items-center gap-1.5 truncate text-sm text-slate-600">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Requested {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>
                <Badge tone={statusTone[u.status || "approved"]}>{u.status || "approved"}</Badge>
              </div>

              {u.status === "pending" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => act(u._id, "approve")} className={btnPrimary} disabled={busy === u._id}>
                    <UserCheck className="h-4 w-4" />
                    {busy === u._id ? "Saving…" : "Approve"}
                  </button>
                  <button onClick={() => act(u._id, "reject")} className={btnDanger} disabled={busy === u._id}>
                    <UserX className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}

              {u.status === "approved" && (
                <div className="mt-4">
                  <button onClick={() => act(u._id, "reject")} className={btnGhost} disabled={busy === u._id}>
                    <XCircle className="h-4 w-4" /> Revoke access
                  </button>
                </div>
              )}

              {u.status === "rejected" && (
                <div className="mt-4">
                  <button onClick={() => act(u._id, "approve")} className={btnGhost} disabled={busy === u._id}>
                    <CheckCircle2 className="h-4 w-4" /> Approve anyway
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
