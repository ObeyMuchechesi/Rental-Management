import { connectDB } from "@/lib/db";
import { Payment } from "@/models";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

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

    // Send receipt email
    try {
      const tenant = await payment.lease.populate("tenant");
      const unit = await payment.lease.populate("unit");
      if (tenant && tenant.email) {
        const from = process.env.EMAIL_FROM || "Rentals <onboarding@resend.dev>";
        const subject = `Payment received — $${payment.amount.toFixed(2)}`;
        const html = `
          <p>Hi ${tenant.name},</p>
          <p>We received <strong>$${payment.amount.toFixed(2)}</strong> for ${unit?.label || "your unit"}
            on ${payment.paidDate.toLocaleDateString()}.</p>
          <p>Thank you!</p>
        `;
        // Note: email sending is fire-and-forget; won't block the API response
        // fetch("/api/email/send", { method: "POST", body: JSON.stringify({ to: tenant.email, subject, html }) })
      }
    } catch (e) {
      console.error("Email send failed:", e);
    }
  } else if (session.user.role === "landlord") {
    Object.assign(payment, body);
    await payment.save();
  }
  return NextResponse.json(payment);
}