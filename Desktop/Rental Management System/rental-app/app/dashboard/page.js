"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function DashboardPage() {
  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(data => {
      const {
        totalUnits, occupied, vacant,
        occupancyRate, openMaintenance,
        collectedThisMonth, outstanding
      } = data;

      // Update page title/headline
      document.title = `Rental Dashboard — ${occupied} occupied of ${totalUnits} units`;

      // Render summary cards
      const summaryContainer = document.getElementById("summary-cards");
      if (!summaryContainer) return;

      summaryContainer.innerHTML = `
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Total Units</p>
            <p className="text-2xl font-bold">${totalUnits}</p>
          </div>
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Occupied</p>
            <p className="text-2xl font-bold text-green-600">${occupied}</p>
          </div>
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Vacant</p>
            <p className="text-2xl font-bold text-red-600">${vacant}</p>
          </div>
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Occupancy Rate</p>
            <p className="text-2xl font-bold">${occupancyRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Open Maintenance</p>
            <p className="text-2xl font-bold text-yellow-600">${openMaintenance}</p>
          </div>
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Collected This Month</p>
            <p className="text-2xl font-bold text-green-600">$ {collectedThisMonth.toFixed(2)}</p>
          </div>
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">$ {outstanding.toFixed(2)}</p>
          </div>
        </div>
      `;
    });
  }, []);

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div id="summary-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"></div>
    </main>
  );
}