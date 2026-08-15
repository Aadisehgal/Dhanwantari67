"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, branchScope } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";

export async function scheduleVaccination(patientId: string, vaccineName: string, doseNumber: number, dueDate: string) {
  await requirePermission("PATIENTS", "CREATE");

  const record = await prisma.vaccinationRecord.create({
    data: { patientId, vaccineName, doseNumber, dueDate: new Date(dueDate) },
  });

  revalidatePath("/dashboard/vaccinations");
  return { ok: true, record };
}

export async function markVaccinationGiven(id: string, administeredBy?: string) {
  await requirePermission("PATIENTS", "EDIT");

  const record = await prisma.vaccinationRecord.update({
    where: { id },
    data: { givenDate: new Date(), administeredBy },
  });

  revalidatePath("/dashboard/vaccinations");
  return { ok: true, record };
}

/** Due-date dashboard: vaccinations due within the next N days that haven't been given yet. */
export async function getUpcomingVaccinations(days = 30) {
  const session = await requirePermission("PATIENTS", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  return prisma.vaccinationRecord.findMany({
    where: {
      patient: scope,
      givenDate: null,
      dueDate: { lte: addDays(new Date(), days) },
    },
    include: { patient: { select: { name: true, phone: true, uhid: true } } },
    orderBy: { dueDate: "asc" },
  });
}
