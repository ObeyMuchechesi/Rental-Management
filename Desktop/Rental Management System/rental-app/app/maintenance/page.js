"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Wrench, Send, AlertTriangle, DoorOpen, User } from "lucide-react";
import { Alert, Badge, EmptyState, Loading, PageHeader, btnPrimary, inputClass } from "@/app/components/ui";

const statusTone = { open: "amber", in_progress: "blue", resolved: "green" };
const priorityTone = { low: "slate", medium: "blue", high: "red" };

export default function MaintenancePage() {
  const { data: session } = useSession();
  const isLandlord = session?.user?.role === "landlord";
  const [requests, setRequests] = useState([]);
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({ unit: "", title: "", description: "", priority: "medium" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/maintenance");
    const data = await res.json();
    if (res.ok) setRequests(Array.isArray(data) ? data : []);
    else setError(data.error || "Failed to load requests");
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (isLandlord) {
      fetch("/api/units")
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setUnits(Array.isArray(d) ? d : []));
    }
  }, [isLandlord]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Could not submit request");
    setForm({ unit: "", title: "", description: "", priority: "medium" });
    load();
  };

  const setStatus = async (id, status) => {
    const res = await fetch("/api/maintenance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) setError((await res.json()).error || "Could not update request");
    else load();
  };

  return (
    <main className="space-y-5 pb-10">
      <PageHeader
        eyebrow="Care"
        title={isLandlord ? "Maintenance" : "My requests"}
        subtitle={
          isLandlord
            ? "Repairs reported by tenants, with priority and status."
            : "Report a problem in your unit and follow its progress."
        }
        icon={Wrench}
        actions={
          <Badge tone="amber">
            <AlertTriangle className="h-3.5 w-3.5" />
            {requests.filter((r) => r.status !== "resolved").length} open
          </Badge>
        }
      />

      <form onSubmit={submit} className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {isLandlord && (
            <select className={inputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required>
              <option value="">Unit…</option>
              {units.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.property?.name ? `${u.property.name} · ${u.label}` : u.label}
                </option>
              ))}
            </select>
          )}
          <input
            className={`${inputClass} ${isLandlord ? "" : "md:col-span-2"}`}
            placeholder="Issue title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            className={inputClass}
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <button className={btnPrimary} disabled={busy}>
            <Send className="h-4 w-4" /> {busy ? "Sending…" : "Submit request"}
          </button>
        </div>
      </form>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading requests…" />
      ) : requests.length === 0 ? (
        <EmptyState icon={Wrench} title="Nothing to fix" description="Maintenance requests will appear here." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <article key={r._id} className="glass-card rounded-2xl p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{r.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                    {r.unit?.label ? (
                      <span className="flex items-center gap-1.5">
                        <DoorOpen className="h-3.5 w-3.5 text-slate-400" />
                        {r.unit.label}
                      </span>
                    ) : null}
                    {r.tenant?.name ? (
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {r.tenant.name}
                      </span>
                    ) : null}
                    <Badge tone={priorityTone[r.priority] || "slate"}>{r.priority} priority</Badge>
                  </p>
                  {r.description ? <p className="mt-2 text-sm text-slate-600">{r.description}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone[r.status] || "slate"}>{r.status.replace("_", " ")}</Badge>
                  {isLandlord && r.status !== "resolved" && (
                    <select
                      className={`${inputClass} w-auto py-1.5 text-sm`}
                      value={r.status}
                      onChange={(e) => setStatus(r._id, e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
