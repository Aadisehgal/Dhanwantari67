"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function submitFeedback(patientId: string, doctorId: string | undefined, rating: number, comment?: string) {
  await requirePermission("PATIENTS", "CREATE");

  const feedback = await prisma.feedback.create({
    data: { patientId, doctorId, rating, comment },
  });

  revalidatePath("/dashboard/feedback");
  return { ok: true, feedback };
}

export async function listFeedback() {
  await requirePermission("REPORTS", "VIEW");

  const feedback = await prisma.feedback.findMany({
    include: { patient: { select: { name: true } }, doctor: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return feedback;
}

/** Doctor-wise average rating and NPS-style breakdown. */
export async function getDoctorSatisfactionScores() {
  await requirePermission("REPORTS", "VIEW");

  const doctors = await prisma.doctor.findMany({
    include: { user: { select: { name: true } }, feedback: { select: { rating: true } } },
  });

  return doctors
    .filter((d) => d.feedback.length > 0)
    .map((d) => {
      const ratings = d.feedback.map((f) => f.rating);
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const promoters = ratings.filter((r) => r >= 4).length;
      const detractors = ratings.filter((r) => r <= 2).length;
      const nps = Math.round(((promoters - detractors) / ratings.length) * 100);
      return { doctor: d.user.name, avgRating: Math.round(avg * 10) / 10, responseCount: ratings.length, nps };
    });
}
