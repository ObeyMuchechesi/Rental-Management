import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User, Tenant } from "@/models";
import { assert, json, route, HttpError } from "@/lib/api";

export const POST = route(async (req) => {
  const body = await req.json();
  assert(body, ["name", "email", "password", "role"]);

  const role = body.role === "tenant" ? "tenant" : "landlord";
  if (String(body.password).length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters");
  }

  await connectDB();
  const email = String(body.email).toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) throw new HttpError(409, "An account with that email already exists");

  const passwordHash = await bcrypt.hash(String(body.password), 10);
  const user = await User.create({ name: body.name, email, passwordHash, role });

  // A landlord may already have created a tenancy record for this email.
  // Link to it when so, otherwise create a fresh record owned by this account.
  if (role === "tenant") {
    const existingTenant = await Tenant.findOne({ email });
    const tenant =
      existingTenant ||
      (await Tenant.create({
        owner: user._id,
        name: body.name,
        email,
        phone: body.phone || undefined,
      }));

    user.tenant = tenant._id;
    await user.save();
  }

  return json({ id: user._id.toString(), email: user.email, role: user.role }, 201);
});
