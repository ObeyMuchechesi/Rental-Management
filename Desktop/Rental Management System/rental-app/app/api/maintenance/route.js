import { connectDB } from "@/lib/db";
import { Maintenance, Lease } from "@/models";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();

  const filter = session.user.role === "tenant"
    ? { tenant: session.user.tenantId }
    : {};

  return NextResponse.json(
    await Maintenance.find(filter).populate("unit").populate("tenant")
      .sort({ createdAt: -1 }).lean()
  );
}

export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();

  if (session.user.role === "tenant") {
    if (!session.user.tenantId) return NextResponse.json({ error: "No tenant profile" }, { status: 400 });
    body.tenant = session.user.tenantId;
    // derive unit from active lease
    const active = await Lease.findOne({ tenant: session.user.tenantId, status: "active" });
    if (!active) return NextResponse.json({ error: "No active lease" }, { status: 400 });
    body.unit = active.unit;
  }

  const item = await Maintenance.create(body);
  return NextResponse.json(item, { status: 201 });
}