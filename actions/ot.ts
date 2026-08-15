"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, branchScope } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { addMinutes } from "date-fns";

export interface OTBookingInput {
  patientId: string;
  admissionId?: string;
  surgeonId: string;
  otRoom: string;
  procedureName: string;
  scheduledAt: string;
  durationMins: number;
  notes?: string;
}

/**
 * Books an OT slot after checking for overlapping bookings in the same room
 * OR with the same surgeon (a surgeon can't be in two theatres at once).
 */
export async function bookOT(input: OTBookingInput) {
  const session = await requirePermission("OT", "CREATE");
  const branchId = session.branchId;
  if (!branchId) return { ok: false, error: "No branch assigned" };

  const start = new Date(input.scheduledAt);
  const end = addMinutes(start, input.durationMins);

  const overlapping = await prisma.oTBooking.findMany({
    where: {
      branchId,
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      OR: [{ otRoom: input.otRoom }, { surgeonId: input.surgeonId }],
    },
  });

  const conflict = overlapping.find((b) => {
    const bStart = b.scheduledAt;
    const bEnd = addMinutes(bStart, b.durationMins);
    return start < bEnd && end > bStart && (b.otRoom === input.otRoom || b.surgeonId === input.surgeonId);
  });

  if (conflict) {
    const reason = conflict.otRoom === input.otRoom ? `OT room ${input.otRoom} is already booked` : "Surgeon already has a booking";
    return { ok: false, error: `${reason} in this time window` };
  }

  const booking = await prisma.oTBooking.create({
    data: {
      branchId,
      patientId: input.patientId,
      admissionId: input.admissionId,
      surgeonId: input.surgeonId,
      otRoom: input.otRoom,
      procedureName: input.procedureName,
      scheduledAt: start,
      durationMins: input.durationMins,
      notes: input.notes,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "OT", metadata: { bookingId: booking.id } },
  });

  revalidatePath("/dashboard/ot");
  return { ok: true, booking };
}

export async function updateOTStatus(bookingId: string, status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED") {
  await requirePermission("OT", "EDIT");

  const booking = await prisma.oTBooking.update({ where: { id: bookingId }, data: { status } });

  revalidatePath("/dashboard/ot");
  return { ok: true, booking };
}

export async function getOTSchedule(startTime: string, endTime: string) {
  const session = await requirePermission("OT", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  return prisma.oTBooking.findMany({
    where: { ...scope, scheduledAt: { gte: new Date(startTime), lte: new Date(endTime) } },
    include: {
      patient: { select: { name: true, uhid: true } },
      surgeon: { include: { user: { select: { name: true } } } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}
