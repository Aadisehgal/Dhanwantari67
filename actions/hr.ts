"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { calculatePayslip } from "@/lib/payroll-utils";
import { revalidatePath } from "next/cache";
import { getDaysInMonth, startOfDay } from "date-fns";
import { LeaveType, ShiftType } from "@prisma/client";
import { notifyUser } from "@/actions/notifications";

const HR_ADMIN_ROLES = ["HR_MANAGER", "HOSPITAL_ADMIN", "BRANCH_ADMIN", "SUPER_ADMIN"];

/** Throws unless the caller is acting on their own staff record or holds an HR/admin role. */
async function assertOwnStaffOrAdmin(staffId: string, callerUserId: string, callerRole: string) {
  if (HR_ADMIN_ROLES.includes(callerRole)) return;
  const staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { userId: true } });
  if (!staff || staff.userId !== callerUserId) {
    throw new Error("You can only perform this action on your own staff record");
  }
}

export async function listStaff() {
  await requirePermission("HR", "VIEW");
  return prisma.staff.findMany({
    include: { user: { select: { name: true, email: true, role: { select: { label: true } } } } },
    orderBy: { joinedAt: "desc" },
  });
}

export async function getStaffDetail(staffId: string) {
  await requirePermission("HR", "VIEW");
  return prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      attendance: { orderBy: { date: "desc" }, take: 30 },
      leaveRequests: { orderBy: { createdAt: "desc" }, take: 10 },
      payslips: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 12 },
    },
  });
}

/** Self-service check-in: creates today's attendance record if it doesn't already exist. */
export async function checkIn(staffId: string) {
  const session = await requirePermission("HR", "CREATE");
  await assertOwnStaffOrAdmin(staffId, session.userId, session.role);
  const today = startOfDay(new Date());

  const attendance = await prisma.attendance.upsert({
    where: { staffId_date: { staffId, date: today } },
    update: { checkIn: new Date(), status: "PRESENT" },
    create: { staffId, date: today, checkIn: new Date(), status: "PRESENT" },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "HR", metadata: { staffId, type: "check-in" } },
  });

  revalidatePath("/dashboard/hr");
  return { ok: true, attendance };
}

export async function checkOut(staffId: string) {
  const session = await requirePermission("HR", "EDIT");
  await assertOwnStaffOrAdmin(staffId, session.userId, session.role);
  const today = startOfDay(new Date());

  const attendance = await prisma.attendance.update({
    where: { staffId_date: { staffId, date: today } },
    data: { checkOut: new Date() },
  });

  revalidatePath("/dashboard/hr");
  return { ok: true, attendance };
}

/** Admin override: mark attendance manually for a specific date. */
export async function markAttendance(
  staffId: string,
  date: string,
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "HOLIDAY"
) {
  const session = await requirePermission("HR", "EDIT");
  if (!HR_ADMIN_ROLES.includes(session.role)) {
    throw new Error("Only HR/admin roles can manually adjust attendance");
  }
  const day = startOfDay(new Date(date));

  const attendance = await prisma.attendance.upsert({
    where: { staffId_date: { staffId, date: day } },
    update: { status },
    create: { staffId, date: day, status },
  });

  revalidatePath("/dashboard/hr");
  return { ok: true, attendance };
}

export async function assignShift(staffId: string, date: string, shiftType: ShiftType) {
  const session = await requirePermission("HR", "CREATE");
  if (!HR_ADMIN_ROLES.includes(session.role)) {
    throw new Error("Only HR/admin roles can assign shifts");
  }
  const day = startOfDay(new Date(date));

  const shift = await prisma.shiftRoster.upsert({
    where: { staffId_date: { staffId, date: day } },
    update: { shiftType },
    create: { staffId, date: day, shiftType },
  });

  revalidatePath("/dashboard/hr/roster");
  return { ok: true, shift };
}

export async function getWeekRoster(startDate: string, endDate: string) {
  await requirePermission("HR", "VIEW");
  return prisma.shiftRoster.findMany({
    where: { date: { gte: new Date(startDate), lte: new Date(endDate) } },
    include: { staff: { include: { user: { select: { name: true } } } } },
    orderBy: [{ date: "asc" }],
  });
}

export async function applyLeave(staffId: string, leaveType: LeaveType, startDate: string, endDate: string, reason?: string) {
  const session = await requirePermission("HR", "CREATE");
  await assertOwnStaffOrAdmin(staffId, session.userId, session.role);

  const leave = await prisma.leaveRequest.create({
    data: { staffId, leaveType, startDate: new Date(startDate), endDate: new Date(endDate), reason },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "HR", metadata: { leaveId: leave.id } },
  });

  revalidatePath("/dashboard/hr/leaves");
  return { ok: true, leave };
}

export async function reviewLeave(leaveId: string, decision: "APPROVED" | "REJECTED") {
  const session = await requirePermission("HR", "APPROVE");
  if (!HR_ADMIN_ROLES.includes(session.role)) {
    throw new Error("Only HR/admin roles can approve or reject leave requests");
  }

  const leave = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: decision, approvedById: session.userId },
    include: { staff: { select: { userId: true } } },
  });

  await notifyUser(
    leave.staff.userId,
    "LEAVE_STATUS",
    `Leave request ${decision.toLowerCase()}`,
    `Your leave request has been ${decision.toLowerCase()}.`,
    "/dashboard/hr/leaves"
  );

  revalidatePath("/dashboard/hr/leaves");
  return { ok: true, leave };
}

export async function listLeaveRequests() {
  await requirePermission("HR", "VIEW");
  return prisma.leaveRequest.findMany({
    include: { staff: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Generates a monthly payslip: counts unpaid-leave/absent days in that
 * month, applies the standard payroll formula, and stores the result
 * (idempotent per staff/month/year).
 */
export async function generatePayslip(staffId: string, month: number, year: number) {
  const session = await requirePermission("HR", "CREATE");
  if (!HR_ADMIN_ROLES.includes(session.role)) {
    throw new Error("Only HR/admin roles can generate payslips");
  }

  const staff = await prisma.staff.findUniqueOrThrow({ where: { id: staffId } });

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  const daysInMonth = getDaysInMonth(monthStart);

  const unpaidLeaves = await prisma.leaveRequest.count({
    where: {
      staffId,
      leaveType: "UNPAID",
      status: "APPROVED",
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
  });

  const absentDays = await prisma.attendance.count({
    where: { staffId, status: "ABSENT", date: { gte: monthStart, lte: monthEnd } },
  });

  const unpaidLeaveDays = unpaidLeaves + absentDays;

  const calc = calculatePayslip(Number(staff.basicSalary), daysInMonth, unpaidLeaveDays);

  const payslip = await prisma.payslip.upsert({
    where: { staffId_month_year: { staffId, month, year } },
    update: calc,
    create: { staffId, month, year, ...calc },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "HR", metadata: { payslipId: payslip.id, staffId, month, year } },
  });

  revalidatePath("/dashboard/hr/payroll");
  return { ok: true, payslip };
}
