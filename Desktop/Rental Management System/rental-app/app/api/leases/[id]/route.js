import { connectDB } from "@/lib/db";
import { Lease, Unit } from "@/models";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  const session = await auth();
  if (session?.user?.role !== "landlord") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const { id } = await params;
  const updates = await req.json();
  const lease = await Lease.findByIdAndUpdate(id, updates, { new: true });
  if (!lease) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (updates.status === "ended") {
    // Free the unit only if no other active lease exists
    const stillActive = await Lease.findOne({ unit: lease.unit, status: "active" });
    if (!stillActive) {
      await Unit.findByIdAndUpdate(lease.unit, { status: "vacant" });
    }
  }
  return NextResponse.json(lease);
}