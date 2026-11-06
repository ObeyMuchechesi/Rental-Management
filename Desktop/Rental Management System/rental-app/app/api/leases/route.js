import { connectDB } from "@/lib/db";
import { Property, Unit, Tenant, Lease, User } from "@/models";
import { generatePaymentsForLease } from "@/lib/payments";
import { assert, json, route, requireUser, requireLandlord, currentTenantId, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  await connectDB();

  if (user.role === "tenant") {
    const tenantId = await currentTenantId(user);
    if (!tenantId) return json([]);
    const leases = await Lease.find({ tenant: tenantId })
      .populate("unit", "label rentAmount")
      .populate({ path: "unit", populate: { path: "property", select: "name address" } })
      .sort({ createdAt: -1 })
      .lean();
    return json(leases);
  }

  const properties = await Property.find({ owner: user.id }).select("_id").lean();
  const units = await Unit.find({ property: { $in: properties.map((p) => p._id) } }).select("_id").lean();
  const leases = await Lease.find({ unit: { $in: units.map((u) => u._id) } })
    .populate("tenant", "name email")
    .populate({ path: "unit", select: "label rentAmount property", populate: { path: "property", select: "name" } })
    .sort({ createdAt: -1 })
    .lean();

  return json(leases);
});

export const POST = route(async (req) => {
  const user = await requireLandlord();
  const body = await req.json();
  assert(body, ["unit", "tenant", "startDate", "endDate", "monthlyRent"]);

  await connectDB();
  const properties = await Property.find({ owner: user.id }).select("_id").lean();
  const unit = await Unit.findOne({ _id: body.unit, property: { $in: properties.map((p) => p._id) } });
  if (!unit) throw new HttpError(404, "Unit not found");
  if (unit.status === "occupied") throw new HttpError(409, "That unit is already occupied");

  const tenant = await Tenant.findOne({ _id: body.tenant, owner: user.id });
  if (!tenant) throw new HttpError(404, "Tenant not found");

  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new HttpError(400, "Invalid lease dates");
  }
  if (endDate <= startDate) throw new HttpError(400, "End date must be after the start date");

  const active = await Lease.findOne({ tenant: tenant._id, status: "active" });
  if (active) throw new HttpError(409, "That tenant already has an active lease");

  const lease = await Lease.create({
    unit: unit._id,
    tenant: tenant._id,
    startDate,
    endDate,
    monthlyRent: Number(body.monthlyRent),
    deposit: Number(body.deposit || 0),
    status: "active",
  });

  unit.status = "occupied";
  await unit.save();

  // Attach the tenant's login account to this tenancy straight away so the new
  // lease shows up in their portal on the next page load, not just after their
  // next sign-in.
  await User.updateOne(
    { email: tenant.email, role: "tenant" },
    { $set: { tenant: tenant._id } },
  );

  await generatePaymentsForLease(lease);

  return json(lease.toObject(), 201);
});
