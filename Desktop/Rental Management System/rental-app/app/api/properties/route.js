import { connectDB } from "@/lib/db";
import { Property, Unit, Lease } from "@/models";
import { assert, json, route, requireLandlord } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireLandlord();
  await connectDB();

  const properties = await Property.find({ owner: user.id }).sort({ createdAt: -1 }).lean();
  const propertyIds = properties.map((p) => p._id);
  const units = await Unit.find({ property: { $in: propertyIds } }).select("property status").lean();

  const counts = units.reduce((acc, u) => {
    const key = u.property.toString();
    acc[key] = acc[key] || { total: 0, occupied: 0 };
    acc[key].total += 1;
    if (u.status === "occupied") acc[key].occupied += 1;
    return acc;
  }, {});

  return json(
    properties.map((p) => ({
      ...p,
      unitCount: counts[p._id.toString()]?.total ?? 0,
      occupiedCount: counts[p._id.toString()]?.occupied ?? 0,
    })),
  );
});

export const POST = route(async (req) => {
  const user = await requireLandlord();
  const body = await req.json();
  assert(body, ["name", "address"]);

  await connectDB();
  const property = await Property.create({
    owner: user.id,
    name: body.name,
    address: body.address,
    type: body.type || "apartment",
  });

  return json(property.toObject(), 201);
});
