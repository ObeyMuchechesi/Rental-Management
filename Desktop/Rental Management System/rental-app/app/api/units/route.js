import { connectDB } from "@/lib/db";
import { Property, Unit, Lease } from "@/models";
import { assert, json, route, requireLandlord, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireLandlord();
  await connectDB();

  const properties = await Property.find({ owner: user.id }).select("_id").lean();
  const units = await Unit.find({ property: { $in: properties.map((p) => p._id) } })
    .populate("property", "name address")
    .sort({ createdAt: -1 })
    .lean();

  // Show who lives in each occupied unit so the grid doubles as an assignment map.
  const leases = await Lease.find({ unit: { $in: units.map((u) => u._id) }, status: "active" })
    .populate("tenant", "name email")
    .lean();
  const byUnit = leases.reduce((acc, l) => {
    acc[l.unit.toString()] = { name: l.tenant?.name || null, id: l.tenant?._id?.toString() || null, leaseId: l._id.toString() };
    return acc;
  }, {});

  return json(units.map((u) => ({ ...u, tenant: byUnit[u._id.toString()] || null })));
});

export const POST = route(async (req) => {
  const user = await requireLandlord();
  const body = await req.json();
  assert(body, ["property", "label", "rentAmount"]);

  await connectDB();
  const property = await Property.findOne({ _id: body.property, owner: user.id });
  if (!property) throw new HttpError(404, "Property not found");

  const optionalNumber = (v) =>
    v === undefined || v === null || v === "" ? undefined : Number(v);

  const unit = await Unit.create({
    property: property._id,
    label: body.label,
    rentAmount: Number(body.rentAmount),
    bedrooms: optionalNumber(body.bedrooms),
    bathrooms: optionalNumber(body.bathrooms),
    status: body.status || "vacant",
  });

  return json(unit.toObject(), 201);
});

export const PATCH = route(async (req) => {
  const user = await requireLandlord();
  const body = await req.json();
  assert(body, ["id"]);

  await connectDB();
  const owned = await Property.find({ owner: user.id }).select("_id").lean();
  const unit = await Unit.findOneAndUpdate(
    { _id: body.id, property: { $in: owned.map((p) => p._id) } },
    { $set: { label: body.label, rentAmount: Number(body.rentAmount), status: body.status } },
    { new: true, runValidators: true },
  );
  if (!unit) throw new HttpError(404, "Unit not found");

  return json(unit.toObject());
});

export const DELETE = route(async (req) => {
  const user = await requireLandlord();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw new HttpError(400, "Missing unit id");

  await connectDB();
  const owned = await Property.find({ owner: user.id }).select("_id").lean();
  const unit = await Unit.findOneAndDelete({ _id: id, property: { $in: owned.map((p) => p._id) } });
  if (!unit) throw new HttpError(404, "Unit not found");

  await Lease.deleteMany({ unit: id });
  return json({ ok: true });
});
