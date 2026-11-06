import { connectDB } from "@/lib/db";
import { Property, Unit, Lease, Payment, Maintenance } from "@/models";
import { json, route, requireUser, currentTenantId } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  await connectDB();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  if (user.role === "tenant") {
    const tenantId = await currentTenantId(user);

    const lease = tenantId
      ? await Lease.findOne({ tenant: tenantId, status: "active" })
          .populate({ path: "unit", select: "label", populate: { path: "property", select: "name address" } })
          .lean()
      : null;

    const payments = lease
      ? await Payment.find({ lease: lease._id }).sort({ dueDate: 1 }).lean()
      : [];
    const requests = tenantId
      ? await Maintenance.find({ tenant: tenantId }).sort({ createdAt: -1 }).lean()
      : [];

    const outstanding = payments
      .filter((p) => p.status !== "paid")
      .reduce((sum, p) => sum + p.amount, 0);

    return json({
      role: "tenant",
      lease,
      nextPayment: payments.find((p) => p.status !== "paid") ?? null,
      outstanding,
      openMaintenance: requests.filter((r) => r.status !== "resolved").length,
    });
  }

  const properties = await Property.find({ owner: user.id }).select("_id").lean();
  const units = await Unit.find({ property: { $in: properties.map((p) => p._id) } }).select("_id status").lean();
  const unitIds = units.map((u) => u._id);
  const leases = await Lease.find({ unit: { $in: unitIds } }).select("_id status").lean();
  const leaseIds = leases.map((l) => l._id);

  const payments = await Payment.find({ lease: { $in: leaseIds } }).select("amount status dueDate paidDate").lean();
  const maintenance = await Maintenance.find({ unit: { $in: unitIds } }).select("status").lean();

  const totalUnits = units.length;
  const occupied = units.filter((u) => u.status === "occupied").length;
  const vacant = units.filter((u) => u.status === "vacant").length;
  const occupancyRate = totalUnits ? Math.round((occupied / totalUnits) * 100) : 0;

  const collectedThisMonth = payments
    .filter((p) => p.status === "paid" && p.paidDate && new Date(p.paidDate) >= monthStart && new Date(p.paidDate) < monthEnd)
    .reduce((sum, p) => sum + p.amount, 0);
  const outstanding = payments.filter((p) => p.status !== "paid").reduce((sum, p) => sum + p.amount, 0);
  const overdue = payments.filter((p) => p.status !== "paid" && new Date(p.dueDate) < now).length;

  return json({
    role: "landlord",
    totalProperties: properties.length,
    totalUnits,
    occupied,
    vacant,
    occupancyRate,
    activeLeases: leases.filter((l) => l.status === "active").length,
    openMaintenance: maintenance.filter((m) => m.status !== "resolved").length,
    collectedThisMonth,
    outstanding,
    overdue,
  });
});
