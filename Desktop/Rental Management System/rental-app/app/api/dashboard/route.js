import { connectDB } from "@/lib/db";
import { Unit, Payment, Maintenance } from "@/models";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "landlord") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();

  const [totalUnits, occupied, openMaintenance] = await Promise.all([
    Unit.countDocuments(),
    Unit.countDocuments({ status: "occupied" }),
    Maintenance.countDocuments({ status: { $ne: "resolved" } }),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [collected, outstanding] = await Promise.all([
    Payment.aggregate([
      { $match: { status: "paid", paidDate: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { status: { $in: ["pending", "late"] }, dueDate: { $lt: monthEnd } } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]),
  ]);

  return NextResponse.json({
    totalUnits, occupied,
    vacant: totalUnits - occupied,
    occupancyRate: totalUnits ? Math.round((occupied / totalUnits) * 100) : 0,
    openMaintenance,
    collectedThisMonth: collected[0]?.sum ?? 0,
    outstanding: outstanding[0]?.sum ?? 0,
  });
}