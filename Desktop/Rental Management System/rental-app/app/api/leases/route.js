import { connectDB } from "@/lib/db";
import { Lease, Unit } from "@/models";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generatePaymentsForLease } from "@/lib/payments";

export async function GET(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();

  const filter = {};
  if (session.user.role === "tenant") {
    if (!session.user.tenantId) return NextResponse.json([]);
    filter.tenant = session.user.tenantId;
  }

  const leases = await Lease.find(filter)
    .populate("unit").populate("tenant")
    .sort({ createdAt: -1 }).lean();
  return NextResponse.json(leases);
}

export async function POST(req) {
  const session = await auth();
  if (session?.user?.role !== "landlord") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const body = await req.json();

  // Prevent overlapping active lease on same unit
  const existingActive = await Lease.findOne({ unit: body.unit, status: "active" });
  if (existingActive) {
    return NextResponse.json({ error: "Unit already has an active lease" }, { status: 409 });
  }

  const lease = await Lease.create({ ...body, status: "active" });
  // Mark unit as occupied when lease becomes active
  await Unit.findByIdAndUpdate(lease.unit, { status: "occupied" });
  // Generate monthly payments for the lease term
  await generatePaymentsForLease(lease);

  return NextResponse.json(lease, { status: 201 });
}