"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay } from "date-fns";

/** Generates the next sequential token number for a doctor for today. */
export async function generateToken(appointmentId: string) {
  const session = await requirePermission("QUEUE", "CREATE");

  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
  });

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const lastToken = await prisma.token.findFirst({
    where: {
      doctorId: appointment.doctorId,
      createdAt: { gte: todayStart, lte: todayEnd },
    },
    orderBy: { tokenNumber: "desc" },
  });

  const tokenNumber = (lastToken?.tokenNumber ?? 0) + 1;

  const token = await prisma.token.create({
    data: {
      appointmentId,
      doctorId: appointment.doctorId,
      tokenNumber,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "QUEUE", metadata: { tokenId: token.id } },
  });

  revalidatePath("/dashboard/queue");
  return { ok: true, token };
}

export async function callNextToken(doctorId: string) {
  await requirePermission("QUEUE", "EDIT");

  const next = await prisma.token.findFirst({
    where: { doctorId, status: "WAITING" },
    orderBy: { tokenNumber: "asc" },
  });

  if (!next) return { ok: false, error: "No patients waiting" };

  const updated = await prisma.token.update({
    where: { id: next.id },
    data: { status: "CALLED", calledAt: new Date() },
  });

  await prisma.appointment.update({
    where: { id: next.appointmentId },
    data: { status: "IN_CONSULTATION" },
  });

  revalidatePath("/dashboard/queue");
  return { ok: true, token: updated };
}

export async function completeToken(tokenId: string) {
  await requirePermission("QUEUE", "EDIT");

  const token = await prisma.token.update({
    where: { id: tokenId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  await prisma.appointment.update({
    where: { id: token.appointmentId },
    data: { status: "COMPLETED" },
  });

  // Update doctor's rolling average consultation time (simple moving average,
  // rule-based — no paid AI/ML API per master prompt constraints).
  if (token.calledAt && token.completedAt) {
    const durationMins = (token.completedAt.getTime() - token.calledAt.getTime()) / 60000;
    const doctor = await prisma.doctor.findUniqueOrThrow({ where: { id: token.doctorId } });
    const alpha = 0.3; // weight given to the newest sample
    const newAvg = Math.round(doctor.avgConsultMins * (1 - alpha) + durationMins * alpha);
    await prisma.doctor.update({
      where: { id: token.doctorId },
      data: { avgConsultMins: Math.max(5, Math.min(newAvg, 60)) },
    });
  }

  revalidatePath("/dashboard/queue");
  return { ok: true, token };
}

export async function markNoShow(tokenId: string) {
  await requirePermission("QUEUE", "EDIT");
  const token = await prisma.token.update({ where: { id: tokenId }, data: { status: "NO_SHOW" } });
  await prisma.appointment.update({ where: { id: token.appointmentId }, data: { status: "NO_SHOW" } });
  revalidatePath("/dashboard/queue");
  return { ok: true, token };
}

/** Live queue board data for a doctor: waiting list + estimated wait per patient. */
export async function getQueueBoard(doctorId: string) {
  await requirePermission("QUEUE", "VIEW");

  const doctor = await prisma.doctor.findUniqueOrThrow({ where: { id: doctorId } });

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const tokens = await prisma.token.findMany({
    where: { doctorId, createdAt: { gte: todayStart, lte: todayEnd } },
    include: { appointment: { include: { patient: { select: { name: true, uhid: true } } } } },
    orderBy: { tokenNumber: "asc" },
  });

  const waiting = tokens.filter((t) => t.status === "WAITING");

  const withEstimates = waiting.map((t, idx) => ({
    ...t,
    estimatedWaitMins: idx * doctor.avgConsultMins,
  }));

  return {
    avgConsultMins: doctor.avgConsultMins,
    called: tokens.filter((t) => t.status === "CALLED"),
    waiting: withEstimates,
    completed: tokens.filter((t) => t.status === "COMPLETED"),
    noShow: tokens.filter((t) => t.status === "NO_SHOW"),
  };
}
