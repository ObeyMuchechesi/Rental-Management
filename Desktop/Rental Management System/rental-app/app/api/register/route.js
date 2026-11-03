import { connectDB } from "@/lib/db";
import { User, Tenant } from "@/models";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectDB();
  const { name, email, password, role } = await req.json();

  if (!["landlord", "tenant"].includes(role))
    return NextResponse.json({ error: "Bad role" }, { status: 400 });

  if (await User.findOne({ email }))
    return NextResponse.json({ error: "Email in use" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  let tenant = null;

  if (role === "tenant") {
    tenant = await Tenant.findOne({ email });
    if (!tenant) tenant = await Tenant.create({ name, email });
  }

  const user = await User.create({ name, email, passwordHash, role, tenant: tenant?._id });
  if (tenant) await Tenant.findByIdAndUpdate(tenant._id, { user: user._id });

  return NextResponse.json({ id: user._id }, { status: 201 });
}