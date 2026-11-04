import { connectDB } from "@/lib/db";
import { Property, Unit, Lease, Payment } from "@/models";
import { json, route, requireUser, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const PATCH = route(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const payment = await Payment.findById(id).populate("lease", "tenant unit");
  if (!payment) throw new HttpError(404, "Payment not found");

  let allowed = false;
  if (user.role === "tenant") {
    allowed = payment.lease?.tenant?.toString() === user.tenantId;
  } else {
    const properties = await Property.find({ owner: user.id }).select("_id").lean();
    const units = await Unit.find({ property: { $in: properties.map((p) => p._id) } }).select("_id").lean();
    const owns = await Lease.exists({
      _id: payment.lease?._id,
      unit: { $in: units.map((u) => u._id) },
    });
    allowed = Boolean(owns);
  }
  if (!allowed) throw new HttpError(403, "Not allowed");

  if (body.status === "paid") {
    payment.status = "paid";
    payment.paidDate = new Date();
    payment.method = body.method || "bank";
  } else if (body.status === "pending") {
    payment.status = "pending";
    payment.paidDate = undefined;
    payment.method = undefined;
  } else {
    throw new HttpError(400, "status must be 'paid' or 'pending'");
  }

  await payment.save();
  return json(payment.toObject());
});
