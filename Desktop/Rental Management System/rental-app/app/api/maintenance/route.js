import { connectDB } from "@/lib/db";
import { Property, Unit, Lease, Maintenance } from "@/models";
import { assert, json, route, requireUser, currentTenantId, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  await connectDB();

  if (user.role === "tenant") {
    const tenantId = await currentTenantId(user);
    if (!tenantId) return json([]);
    const requests = await Maintenance.find({ tenant: tenantId })
      .populate("unit", "label")
      .sort({ createdAt: -1 })
      .lean();
    return json(requests);
  }

  const properties = await Property.find({ owner: user.id }).select("_id").lean();
  const units = await Unit.find({ property: { $in: properties.map((p) => p._id) } }).select("_id").lean();
  const requests = await Maintenance.find({ unit: { $in: units.map((u) => u._id) } })
    .populate("unit", "label")
    .populate("tenant", "name")
    .sort({ createdAt: -1 })
    .lean();

  return json(requests);
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const body = await req.json();
  assert(body, ["title"]);

  await connectDB();

  let unitId = body.unit || null;
  let tenantId = null;

  if (user.role === "tenant") {
    const linkedTenantId = await currentTenantId(user);
    if (!linkedTenantId) throw new HttpError(400, "Your account is not linked to a tenancy yet");
    const lease = await Lease.findOne({ tenant: linkedTenantId, status: "active" });
    if (!lease) throw new HttpError(400, "You need an active lease to file a request");
    unitId = lease.unit;
    tenantId = linkedTenantId;
  } else {
    if (!unitId) throw new HttpError(400, "Choose a unit for this request");
    const properties = await Property.find({ owner: user.id }).select("_id").lean();
    const unit = await Unit.findOne({ _id: unitId, property: { $in: properties.map((p) => p._id) } });
    if (!unit) throw new HttpError(404, "Unit not found");
  }

  const request_ = await Maintenance.create({
    unit: unitId,
    tenant: tenantId,
    title: body.title,
    description: body.description || undefined,
    priority: body.priority || "medium",
    status: "open",
  });

  return json(request_.toObject(), 201);
});

export const PATCH = route(async (req) => {
  const user = await requireUser();
  if (user.role !== "landlord") throw new HttpError(403, "Landlord access required");
  const body = await req.json();
  assert(body, ["id", "status"]);
  if (!["open", "in_progress", "resolved"].includes(body.status)) {
    throw new HttpError(400, "Invalid status");
  }

  await connectDB();
  const properties = await Property.find({ owner: user.id }).select("_id").lean();
  const units = await Unit.find({ property: { $in: properties.map((p) => p._id) } }).select("_id").lean();
  const request_ = await Maintenance.findOneAndUpdate(
    { _id: body.id, unit: { $in: units.map((u) => u._id) } },
    { $set: { status: body.status } },
    { new: true },
  ).lean();

  if (!request_) throw new HttpError(404, "Request not found");
  return json(request_);
});
