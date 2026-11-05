import { connectDB } from "@/lib/db";
import { Property, Unit, Tenant, Lease, Payment, Maintenance, User } from "@/models";
import { json, route, requireLandlord, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Full picture of one tenant: account, lease, money and open work. */
export const GET = route(async (_req, { params }) => {
  const landlord = await requireLandlord();
  const { id } = await params;
  await connectDB();

  const tenant = await Tenant.findOne({ _id: id, owner: landlord.id }).lean();
  if (!tenant) throw new HttpError(404, "Tenant not found");

  const [account, leases, properties] = await Promise.all([
    User.findOne({ $or: [{ tenant: tenant._id }, { email: tenant.email, role: "tenant" }] })
      .select("name email status createdAt")
      .lean(),
    Lease.find({ tenant: tenant._id })
      .populate({ path: "unit", select: "label rentAmount property", populate: { path: "property", select: "name address" } })
      .sort({ createdAt: -1 })
      .lean(),
    Property.find({ owner: landlord.id }).select("_id name").lean(),
  ]);

  const activeLease = leases.find((l) => l.status === "active") || null;
  const leaseIds = leases.map((l) => l._id);

  const payments = leaseIds.length ? await Payment.find({ lease: { $in: leaseIds } }).lean() : [];
  const paid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const outstanding = payments.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  const openMaintenance = await Maintenance.countDocuments({
    tenant: tenant._id,
    status: { $ne: "resolved" },
  });

  const units = await Unit.find({ property: { $in: properties.map((p) => p._id) } })
    .populate("property", "name")
    .sort({ label: 1 })
    .lean();

  return json({
    tenant,
    account: account || null,
    activeLease,
    leases,
    units: units.map((u) => ({
      _id: u._id.toString(),
      label: u.label,
      status: u.status,
      rentAmount: u.rentAmount,
      property: u.property?.name || null,
      propertyId: u.property?._id?.toString() || null,
    })),
    summary: {
      paid,
      outstanding,
      invoices: payments.length,
      openMaintenance,
    },
  });
});

/** Removes the tenant, their login account, leases, invoices and requests. */
export const DELETE = route(async (_req, { params }) => {
  const landlord = await requireLandlord();
  const { id } = await params;
  await connectDB();

  const tenant = await Tenant.findOne({ _id: id, owner: landlord.id });
  if (!tenant) throw new HttpError(404, "Tenant not found");

  const leases = await Lease.find({ tenant: tenant._id }).select("_id unit").lean();
  const leaseIds = leases.map((l) => l._id);

  if (leaseIds.length) {
    await Payment.deleteMany({ lease: { $in: leaseIds } });
    await Lease.deleteMany({ _id: { $in: leaseIds } });
  }
  await Unit.updateMany({ _id: { $in: leases.map((l) => l.unit) } }, { $set: { status: "vacant" } });
  await Maintenance.deleteMany({ tenant: tenant._id });

  const removedAccounts = await User.deleteMany({
    $or: [{ tenant: tenant._id }, { email: tenant.email, role: "tenant" }],
  });

  await Tenant.deleteOne({ _id: tenant._id });

  return json({ ok: true, removedAccounts: removedAccounts.deletedCount, freedUnits: leases.length });
});
