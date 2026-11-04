import { connectDB } from "@/lib/db";
import { Property, Unit, Lease, Payment } from "@/models";
import { json, route, requireLandlord, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const PATCH = route(async (req, { params }) => {
  const user = await requireLandlord();
  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const property = await Property.findOneAndUpdate(
    { _id: id, owner: user.id },
    { $set: { name: body.name, address: body.address, type: body.type } },
    { new: true, runValidators: true },
  ).lean();

  if (!property) throw new HttpError(404, "Property not found");
  return json(property);
});

export const DELETE = route(async (_req, { params }) => {
  const user = await requireLandlord();
  const { id } = await params;

  await connectDB();
  const property = await Property.findOneAndDelete({ _id: id, owner: user.id });
  if (!property) throw new HttpError(404, "Property not found");

  const units = await Unit.find({ property: id }).select("_id").lean();
  const unitIds = units.map((u) => u._id);
  const leases = await Lease.find({ unit: { $in: unitIds } }).select("_id").lean();
  await Payment.deleteMany({ lease: { $in: leases.map((l) => l._id) } });
  await Lease.deleteMany({ unit: { $in: unitIds } });
  await Unit.deleteMany({ property: id });

  return json({ ok: true });
});
