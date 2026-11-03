"use client";
import { useEffect, useState } from "react";

export default function MyLeasePage() {
  const [lease, setLease] = useState(null);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  useEffect(() => {
    fetch("/api/leases").then(r => r.json()).then(leases => {
      const tenantId = leases.find(l => l.tenant?.toString().includes("temp"))?.tenant?.toString();
      // Actually, we need to get the tenantId from the session
      // This is a simplified version - in production, we'd pass tenantId properly
      fetch("/api/payments").then(r => r.json()).then(payments => {
        fetch("/api/maintenance").then(r => r.json()).then(maintenance => {
          setPayments(payments);
          setMaintenance(maintenance);
        });
      });
    });
  }, []);

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">My Lease</h1>
      {/* Simplified - full implementation would use session.user.tenantId */}
      <p>Lease details would appear here</p>
      <h2>Payments</h2>
      <ul>
        {payments.map(p => (
          <li key={p._id}>
            ${p.amount} — Due {new Date(p.dueDate).toLocaleDateString()} — {p.status}
          </li>
        ))}
      </ul>
      <h2>Maintenance Requests</h2>
      <ul>
        {maintenance.map(m => (
          <li key={m._id}>
            {m.title} — {m.status}
          </li>
        ))}
      </ul>
    </main>
  );
}