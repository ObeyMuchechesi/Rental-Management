import { connectDB } from "@/lib/db";
import { Unit } from "@/models";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();

  const { searchParams } = new URL(req.url);
  const property = searchParams.get("property");
  const filter = property ? { property } : {};
  const units = await Unit.find(filter).populate("property").lean();
  return NextResponse.json(units);
}

export async function POST(req) {
  const session = await auth();
  if (session?.user?.role !== "landlord") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const body = await req.json();
  const unit = await Unit.create(body);
  return NextResponse.json(unit, { status: 201 });
}