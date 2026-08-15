import "server-only";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

function dateBuckets(days: number): string[] {
  const buckets: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    buckets.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
  }
  return buckets;
}

export async function getRevenueTrend(branchId: string, days = 30) {
  const since = startOfDay(subDays(new Date(), days - 1));
  const invoices = await prisma.invoice.findMany({
    where: { branchId, createdAt: { gte: since } },
    select: { createdAt: true, totalAmount: true },
  });

  const buckets = dateBuckets(days);
  const totals: Record<string, number> = Object.fromEntries(buckets.map((b) => [b, 0]));

  for (const inv of invoices) {
    const key = format(inv.createdAt, "yyyy-MM-dd");
    if (key in totals) totals[key]! += Number(inv.totalAmount);
  }

  return buckets.map((date) => ({ date, revenue: Math.round(totals[date]!) }));
}

export async function getPatientRegistrationTrend(branchId: string, days = 30) {
  const since = startOfDay(subDays(new Date(), days - 1));
  const patients = await prisma.patient.findMany({
    where: { branchId, createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = dateBuckets(days);
  const counts: Record<string, number> = Object.fromEntries(buckets.map((b) => [b, 0]));

  for (const p of patients) {
    const key = format(p.createdAt, "yyyy-MM-dd");
    if (key in counts) counts[key]! += 1;
  }

  return buckets.map((date) => ({ date, registrations: counts[date]! }));
}

export async function getPaymentModeBreakdown(branchId: string) {
  const payments = await prisma.payment.findMany({
    where: { invoice: { branchId } },
    select: { mode: true, amount: true },
  });

  const totals: Record<string, number> = {};
  for (const p of payments) {
    totals[p.mode] = (totals[p.mode] ?? 0) + Number(p.amount);
  }

  return Object.entries(totals).map(([mode, amount]) => ({ mode, amount: Math.round(amount) }));
}

export async function getBedOccupancy(branchId: string) {
  const wards = await prisma.ward.findMany({
    where: { branchId },
    include: { beds: { select: { status: true } } },
  });

  return wards.map((w) => {
    const total = w.beds.length;
    const occupied = w.beds.filter((b) => b.status === "OCCUPIED").length;
    return { ward: w.name, total, occupied, vacant: total - occupied, occupancyPercent: total > 0 ? Math.round((occupied / total) * 100) : 0 };
  });
}

export async function getTopDiagnoses(branchId: string, limit = 10) {
  const diagnoses = await prisma.diagnosis.findMany({
    where: { emr: { patient: { branchId } } },
    select: { icd10Code: true, label: true },
  });

  const counts: Record<string, { label: string; count: number }> = {};
  for (const d of diagnoses) {
    const key = d.icd10Code;
    if (!counts[key]) counts[key] = { label: d.label, count: 0 };
    counts[key]!.count += 1;
  }

  return Object.entries(counts)
    .map(([code, v]) => ({ code, label: v.label, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getDoctorConsultationCounts(branchId: string) {
  const doctors = await prisma.doctor.findMany({
    where: { user: { branchId } },
    include: {
      user: { select: { name: true } },
      tokens: { where: { status: "COMPLETED" }, select: { id: true } },
    },
  });

  return doctors
    .map((d) => ({ doctor: d.user.name, consultations: d.tokens.length }))
    .sort((a, b) => b.consultations - a.consultations);
}

export async function getPendingDues(branchId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { branchId, status: { in: ["PENDING", "PARTIALLY_PAID"] } },
    select: { totalAmount: true, amountPaid: true },
  });

  return invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.amountPaid)), 0);
}

export async function getTodayStats(branchId: string) {
  const todayStart = startOfDay(new Date());
  const tomorrowStart = startOfDay(subDays(new Date(), -1));

  const [appointmentsToday, revenueToday, registrationsToday, pendingLeaves, lowStockRows, pendingLabOrders] = await Promise.all([
    prisma.appointment.count({ where: { branchId, scheduledAt: { gte: todayStart, lt: tomorrowStart } } }),
    prisma.invoice.aggregate({ where: { branchId, createdAt: { gte: todayStart, lt: tomorrowStart } }, _sum: { totalAmount: true } }),
    prisma.patient.count({ where: { branchId, createdAt: { gte: todayStart, lt: tomorrowStart } } }),
    prisma.leaveRequest.count({ where: { status: "PENDING", staff: { user: { branchId } } } }),
    prisma.medicineBatch.findMany({ where: { branchId }, select: { stockQty: true, minStockQty: true } }),
    prisma.labOrder.count({ where: { branchId, status: { in: ["ORDERED", "SAMPLE_COLLECTED", "IN_PROGRESS"] } } }),
  ]);

  const lowStockCount = lowStockRows.filter((r) => r.stockQty <= r.minStockQty).length;

  return {
    appointmentsToday,
    revenueToday: Math.round(Number(revenueToday._sum.totalAmount ?? 0)),
    registrationsToday,
    pendingLeaves,
    lowStockCount,
    pendingLabOrders,
  };
}
