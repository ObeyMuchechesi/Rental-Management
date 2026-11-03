import { connectDB } from "@/lib/db";
import { Tenant } from "@/models";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const requireLandlord = async () => {
  const session = await auth();
  if (session?.user?.role !== "landlord") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
};

export async function GET() {
  const deny = await requireLandlord();
  if (deny) return deny;
  await connectDB();
  return NextResponse.json(await Tenant.find().sort({ createdAt: -1 }).lean());
}

export async function POST(req) {
  const deny = await requireLandlord();
  if (deny) return deny;
  await connectDB();
  const tenant = await Tenant.create(await req.json());
  return NextResponse.json(tenant, { status: 201 });
}