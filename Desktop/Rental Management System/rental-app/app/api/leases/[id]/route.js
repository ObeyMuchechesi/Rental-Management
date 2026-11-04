import { connectDB } from "@/lib/db";
import { Property, Unit, Lease, Payment } from "@/models";
import { json, route, requireLandlord, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const PATCH = route(async (req, { params }) => {
  const user = await requireLandlord();
  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const properties = await Property.find({ owner: user.id }).select("_id").lean();
  const units = await Unit.find({ property: { $in: properties.map((p) => p._id) } }).select("_id").lean();

  const lease = await Lease.findOne({ _id: id, unit: { $in: units.map((u) => u._id) } });
  if (!lease) throw new HttpError(404, "Lease not found");

  if (body.status === "ended") {
    lease.status = "ended";
    await lease.save();
    await Unit.updateOne({ _id: lease.unit }, { $set: { status: "vacant" } });
    await Payment.deleteMany({ lease: lease._id, status: "pending" });
  } else if (body.status) {
    lease.status = body.status;
    await lease.save();
  }

  return json(lease.toObject());
});

export const DELETE = route(async (_req, { params }) => {
  const user = await requireLandlord();
  const { id } = await params;

  await connectDB();
  const properties = await Property.find({ owner: user.id }).select("_id").lean();
  const units = await Unit.find({ property: { $in: properties.map((p) => p._id) } }).select("_id").lean();

  const lease = await Lease.findOneAndDelete({ _id: id, unit: { $in: units.map((u) => u._id) } });
  if (!lease) throw new HttpError(404, "Lease not found");

  await Unit.updateOne({ _id: lease.unit }, { $set: { status: "vacant" } });
  await Payment.deleteMany({ lease: lease._id });

  return json({ ok: true });
});
