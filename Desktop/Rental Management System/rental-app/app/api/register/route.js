import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { encryptPassword } from "@/lib/crypto";
import { ensureAdmin } from "@/lib/bootstrap";
import { assert, json, route, HttpError } from "@/lib/api";

/**
 * Only tenants sign up. The landlord account is provisioned by the system,
 * and every tenant account waits for the landlord's approval before it works.
 */
export const POST = route(async (req) => {
  const body = await req.json();
  assert(body, ["name", "email", "password"]);

  if (String(body.password).length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters");
  }

  await ensureAdmin();
  await connectDB();

  const email = String(body.email).toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) throw new HttpError(409, "An account with that email already exists");

  const password = String(body.password);
  const user = await User.create({
    name: String(body.name).trim(),
    email,
    passwordHash: await bcrypt.hash(password, 10),
    passwordEnc: encryptPassword(password),
    role: "tenant",
    status: "pending",
  });

  return json(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
      message: "Account created. Your landlord needs to approve it before you can sign in.",
    },
    201,
  );
});
