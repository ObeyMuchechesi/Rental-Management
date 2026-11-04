import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { encryptPassword, decryptPassword } from "@/lib/crypto";
import { requireUser, json, route, HttpError } from "@/lib/api";

/** Current credentials, including the password the owner asked to be able to see. */
export const GET = route(async () => {
  const session = await requireUser();
  await connectDB();
  const user = await User.findById(session.id).lean();
  if (!user) throw new HttpError(404, "Account not found");

  return json({
    name: user.name,
    email: user.email,
    role: user.role,
    password: decryptPassword(user.passwordEnc),
  });
});

/** Change the sign-in email and/or password. The current password is required. */
export const PATCH = route(async (req) => {
  const session = await requireUser();
  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body?.currentPassword || "");
  if (!currentPassword) throw new HttpError(400, "Enter your current password to save changes");

  await connectDB();
  const user = await User.findById(session.id);
  if (!user) throw new HttpError(404, "Account not found");

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new HttpError(403, "Current password is incorrect");

  let emailChanged = false;

  if (body.email && String(body.email).toLowerCase().trim() !== user.email) {
    const email = String(body.email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid email address");
    const taken = await User.findOne({ email, _id: { $ne: user._id } });
    if (taken) throw new HttpError(409, "Another account already uses that email");
    user.email = email;
    emailChanged = true;
  }

  if (body.newPassword) {
    const next = String(body.newPassword);
    if (next.length < 6) throw new HttpError(400, "New password must be at least 6 characters");
    user.passwordHash = await bcrypt.hash(next, 10);
    user.passwordEnc = encryptPassword(next);
  } else if (!user.passwordEnc) {
    user.passwordEnc = encryptPassword(currentPassword);
  }

  await user.save();

  return json({
    name: user.name,
    email: user.email,
    password: decryptPassword(user.passwordEnc),
    emailChanged,
  });
});
