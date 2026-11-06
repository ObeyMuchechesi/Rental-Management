import { connectDB } from "@/lib/db";
import { Property, Unit, Lease, Payment } from "@/models";
import { assert, json, route, requireUser, requireLandlord, currentTenantId, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  await connectDB();

  if (user.role === "tenant") {
    const tenantId = await currentTenantId(user);
    if (!tenantId) return json([]);
    const leases = await Lease.find({ tenant: tenantId }).select("_id").lean();
    const payments = await Payment.find({ lease: { $in: leases.map((l) => l._id) } })
      .populate({ path: "lease", select: "unit", populate: { path: "unit", select: "label" } })
      .sort({ dueDate: 1 })
      .lean();
    return json(payments);
  }

  const properties = await Property.find({ owner: user.id }).select("_id").lean();
  const units = await Unit.find({ property: { $in: properties.map((p) => p._id) } }).select("_id").lean();
  const leases = await Lease.find({ unit: { $in: units.map((u) => u._id) } }).select("_id").lean();
  const payments = await Payment.find({ lease: { $in: leases.map((l) => l._id) } })
    .populate({ path: "lease", select: "tenant unit", populate: [{ path: "tenant", select: "name" }, { path: "unit", select: "label" }] })
    .sort({ dueDate: 1 })
    .lean();

  return json(payments);
});

export const POST = route(async (req) => {
  const user = await requireLandlord();
  const body = await req.json();
  assert(body, ["lease", "amount", "dueDate"]);

  await connectDB();
  const properties = await Property.find({ owner: user.id }).select("_id").lean();
  const units = await Unit.find({ property: { $in: properties.map((p) => p._id) } }).select("_id").lean();
  const lease = await Lease.findOne({ _id: body.lease, unit: { $in: units.map((u) => u._id) } });
  if (!lease) throw new HttpError(404, "Lease not found");

  const payment = await Payment.create({
    lease: lease._id,
    amount: Number(body.amount),
    dueDate: new Date(body.dueDate),
    status: "pending",
  });

  return json(payment.toObject(), 201);
});
