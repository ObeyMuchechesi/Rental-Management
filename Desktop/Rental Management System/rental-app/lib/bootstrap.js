import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { User } from "@/models";
import { encryptPassword } from "./crypto";

/**
 * The landlord/admin account is never self-registered — it is provisioned by
 * the system the first time it is needed, so only tenants ever sign up.
 */
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@rental.local").toLowerCase();
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12345";

export async function ensureAdmin() {
  await connectDB();
  const existing = await User.findOne({ role: "landlord" }).sort({ createdAt: 1 });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  return User.create({
    name: "Landlord Admin",
    email: ADMIN_EMAIL,
    passwordHash,
    passwordEnc: encryptPassword(ADMIN_PASSWORD),
    role: "landlord",
    status: "approved",
  });
}
