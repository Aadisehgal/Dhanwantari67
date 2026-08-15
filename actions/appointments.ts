"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, branchScope } from "@/lib/permissions";
import { appointmentSchema, type AppointmentFormValues } from "@/lib/validators/patient";
import { revalidatePath } from "next/cache";
import { addDays, addWeeks } from "date-fns";
import { notifyUser } from "@/actions/notifications";

/**
 * Books an appointment. If `recurrence` is set, creates a series (used for
 * physiotherapy/dialysis/chemo style repeat schedules per Section 4.4).
 * Each occurrence gets its own Appointment row so it can be individually
 * rescheduled/cancelled later.
 */
export async function bookAppointment(input: AppointmentFormValues) {
  const session = await requirePermission("APPOINTMENTS", "CREATE");
  const parsed = appointmentSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const branchId = session.branchId;
  if (!branchId) return { ok: false, error: "User has no assigned branch" };

  const baseDate = new Date(data.scheduledAt);
  const dates: Date[] = [baseDate];

  if (data.recurrence) {
    const step = data.recurrence.frequency === "DAILY" ? addDays : addWeeks;
    for (let i = 1; i < data.recurrence.count; i++) {
      dates.push(step(baseDate, i));
    }
  }

  const created = await prisma.$transaction(
    dates.map((d) =>
      prisma.appointment.create({
        data: {
          branchId,
          patientId: data.patientId,
          doctorId: data.doctorId,
          scheduledAt: d,
          reason: data.reason ?? undefined,
          isFollowUp: data.isFollowUp,
        },
      })
    )
  );

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "CREATE",
      module: "APPOINTMENTS",
      metadata: { count: created.length, patientId: data.patientId, doctorId: data.doctorId },
    },
  });

  const doctor = await prisma.doctor.findUnique({ where: { id: data.doctorId }, select: { userId: true } });
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId }, select: { name: true } });
  if (doctor && patient) {
    await notifyUser(
      doctor.userId,
      "APPOINTMENT",
      "New appointment booked",
      `${patient.name} booked for ${baseDate.toLocaleString()}${data.recurrence ? ` (+${created.length - 1} more)` : ""}`,
      "/dashboard/appointments"
    );
  }

  revalidatePath("/dashboard/appointments");
  return { ok: true, appointments: created };
}

export async function rescheduleAppointment(appointmentId: string, newTime: string) {
  await requirePermission("APPOINTMENTS", "EDIT");

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { scheduledAt: new Date(newTime) },
  });

  revalidatePath("/dashboard/appointments");
  return { ok: true, appointment: updated };
}

export async function cancelAppointment(appointmentId: string) {
  await requirePermission("APPOINTMENTS", "EDIT");

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/dashboard/appointments");
  return { ok: true, appointment: updated };
}

export async function markArrived(appointmentId: string) {
  await requirePermission("APPOINTMENTS", "EDIT");

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "ARRIVED" },
  });

  revalidatePath("/dashboard/appointments");
  return { ok: true, appointment: updated };
}

/** Unified calendar feed: appointments + doctor leaves, for a date range. */
export async function getCalendarFeed(startTime: string, endTime: string) {
  const session = await requirePermission("APPOINTMENTS", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  const [appointments, leaves] = await Promise.all([
    prisma.appointment.findMany({
      where: { ...scope, scheduledAt: { gte: new Date(startTime), lte: new Date(endTime) } },
      include: {
        patient: { select: { name: true, uhid: true, phone: true } },
        doctor: { include: { user: { select: { name: true } } } },
        token: true,
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.doctorLeave.findMany({
      where: { startDate: { lte: new Date(endTime) }, endDate: { gte: new Date(startTime) } },
      include: { doctor: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  return { appointments, leaves };
}

/** Auto-creates a follow-up appointment N days out (Section 4/feature #46). */
export async function scheduleFollowUp(patientId: string, doctorId: string, daysFromNow: number, reason?: string) {
  const session = await requirePermission("APPOINTMENTS", "CREATE");
  const branchId = session.branchId;
  if (!branchId) return { ok: false, error: "No branch assigned" };

  const scheduledAt = addDays(new Date(), daysFromNow);

  const appointment = await prisma.appointment.create({
    data: {
      branchId,
      patientId,
      doctorId,
      scheduledAt,
      isFollowUp: true,
      reason: reason ?? "Follow-up visit",
    },
  });

  revalidatePath("/dashboard/appointments");
  return { ok: true, appointment };
}
