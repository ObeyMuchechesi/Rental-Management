import { connectDB } from "@/lib/db";
import { Payment, Lease } from "@/models";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();

  let filter = {};
  if (session.user.role === "tenant") {
    const leases = await Lease.find({ tenant: session.user.tenantId }).select("_id").lean();
    filter = { lease: { $in: leases.map(l => l._id) } };
  }

  const payments = await Payment.find(filter)
    .populate({ path: "lease", populate: ["unit", "tenant"] })
    .sort({ dueDate: -1 }).lean();
  return NextResponse.json(payments);
}

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const payment = await Payment.findById(id).populate("lease");
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "tenant" && payment.lease.tenant.toString() !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.markPaid) {
    payment.status = "paid";
    payment.paidDate = new Date();
    if (body.method) payment.method = body.method;
    await payment.save();
  } else if (session.user.role === "landlord") {
    Object.assign(payment, body);
    await payment.save();
  }
  return NextResponse.json(payment);
}