import { connectDB } from "@/lib/db";
import { Tenant, Lease, User } from "@/models";
import { assert, json, route, requireLandlord, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireLandlord();
  await connectDB();

  const tenants = await Tenant.find({ owner: user.id }).sort({ createdAt: -1 }).lean();
  const ids = tenants.map((t) => t._id);

  const [leases, accounts] = await Promise.all([
    Lease.find({ tenant: { $in: ids }, status: "active" })
      .populate({ path: "unit", select: "label property", populate: { path: "property", select: "name" } })
      .lean(),
    User.find({ $or: [{ tenant: { $in: ids } }, { email: { $in: tenants.map((t) => t.email) }, role: "tenant" }] })
      .select("tenant email status")
      .lean(),
  ]);

  const byTenant = leases.reduce((acc, l) => {
    acc[l.tenant.toString()] = l.unit
      ? { label: l.unit.label, property: l.unit.property?.name ?? null }
      : null;
    return acc;
  }, {});

  const accountByTenant = accounts.reduce((acc, a) => {
    const key = a.tenant?.toString() || tenants.find((t) => t.email === a.email)?._id?.toString();
    if (key) acc[key] = a.status || "approved";
    return acc;
  }, {});

  return json(
    tenants.map((t) => ({
      ...t,
      activeUnit: byTenant[t._id.toString()]?.label ?? null,
      activeProperty: byTenant[t._id.toString()]?.property ?? null,
      accountStatus: accountByTenant[t._id.toString()] || "none",
    })),
  );
});

export const POST = route(async (req) => {
  const user = await requireLandlord();
  const body = await req.json();
  assert(body, ["name", "email"]);

  await connectDB();
  const email = String(body.email).toLowerCase().trim();
  const existing = await Tenant.findOne({ owner: user.id, email });
  if (existing) throw new HttpError(409, "A tenant with that email already exists");

  const tenant = await Tenant.create({
    owner: user.id,
    name: body.name,
    email,
    phone: body.phone || undefined,
    emergencyContact: body.emergencyContact || undefined,
  });

  // If this person already has a tenant account, link it so they can see the lease.
  await User.updateOne(
    { email, role: "tenant", tenant: null },
    { $set: { tenant: tenant._id } },
  );

  return json(tenant.toObject(), 201);
});

export const DELETE = route(async (req) => {
  const user = await requireLandlord();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw new HttpError(400, "Missing tenant id");

  await connectDB();
  const tenant = await Tenant.findOneAndDelete({ _id: id, owner: user.id });
  if (!tenant) throw new HttpError(404, "Tenant not found");

  await Lease.deleteMany({ tenant: id });
  return json({ ok: true });
});
