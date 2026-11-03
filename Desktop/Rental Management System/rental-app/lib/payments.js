import { Payment } from "@/models";

export async function generatePaymentsForLease(lease) {
  const rows = [];
  const start = new Date(lease.startDate);
  const end = new Date(lease.endDate);
  let d = new Date(start);
  while (d <= end) {
    rows.push({
      lease: lease._id,
      amount: lease.monthlyRent,
      dueDate: new Date(d),
      status: "pending",
    });
    d = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  if (rows.length) await Payment.insertMany(rows);
}