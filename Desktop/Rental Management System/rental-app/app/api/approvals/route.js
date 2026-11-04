import { connectDB } from "@/lib/db";
import { User, Tenant } from "@/models";
import { requireLandlord, json, route, HttpError } from "@/lib/api";

/** Landlord-only view of every tenant account and its approval state. */
export const GET = route(async () => {
  await requireLandlord();
  await connectDB();

  const users = await User.find({ role: "tenant" })
    .select("name email status createdAt tenant")
    .sort({ createdAt: -1 })
    .lean();

  const counts = users.reduce(
    (acc, u) => ({ ...acc, [u.status || "approved"]: (acc[u.status || "approved"] || 0) + 1 }),
    { pending: 0, approved: 0, rejected: 0 },
  );

  return json({ users, counts });
});

/** Approve or reject a pending tenant account. */
export const PATCH = route(async (req) => {
  const landlord = await requireLandlord();
  const body = await req.json();
  const action = body?.action;
  if (!["approve", "reject"].includes(action)) {
    throw new HttpError(400, "action must be approve or reject");
  }

  await connectDB();
  const user = await User.findById(body.id);
  if (!user || user.role !== "tenant") throw new HttpError(404, "Tenant account not found");

  if (action === "reject") {
    user.status = "rejected";
    await user.save();
    return json({ id: user._id.toString(), status: user.status });
  }

  user.status = "approved";

  // Link the account to the tenancy record the landlord already created for
  // this email, or create one so the tenant has something to sign in to.
  if (!user.tenant) {
    const tenant =
      (await Tenant.findOne({ owner: landlord.id, email: user.email })) ||
      (await Tenant.create({ owner: landlord.id, name: user.name, email: user.email }));
    user.tenant = tenant._id;
  }

  await user.save();
  return json({ id: user._id.toString(), status: user.status, tenantId: user.tenant.toString() });
});
