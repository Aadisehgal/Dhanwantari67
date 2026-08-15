"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, branchScope } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { notificationProvider } from "@/lib/adapters/notification";

export async function tagChronicCondition(patientId: string, condition: string, diagnosedDate?: string, notes?: string) {
  await requirePermission("PATIENTS", "CREATE");

  const record = await prisma.chronicCondition.create({
    data: { patientId, condition, diagnosedDate: diagnosedDate ? new Date(diagnosedDate) : undefined, notes },
  });

  revalidatePath("/dashboard/chronic-registry");
  return { ok: true, record };
}

export async function listChronicRegistry() {
  const session = await requirePermission("PATIENTS", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  return prisma.chronicCondition.findMany({
    where: { patient: scope },
    include: { patient: { select: { name: true, phone: true, email: true, uhid: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getConditionSummary() {
  const session = await requirePermission("PATIENTS", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  const records = await prisma.chronicCondition.findMany({ where: { patient: scope }, select: { condition: true } });
  const counts: Record<string, number> = {};
  for (const r of records) counts[r.condition] = (counts[r.condition] ?? 0) + 1;

  return Object.entries(counts).map(([condition, count]) => ({ condition, count }));
}

/**
 * Recall Campaign: sends a reminder (email via the free SMTP/console adapter,
 * plus an in-app notification if the patient has a linked portal account) to
 * every patient tagged with the given chronic condition.
 */
export async function runRecallCampaign(condition: string, message: string) {
  const session = await requirePermission("PATIENTS", "EDIT");
  const scope = branchScope(session.role, session.branchId);

  const patients = await prisma.chronicCondition.findMany({
    where: { condition, patient: scope },
    include: { patient: { select: { id: true, name: true, email: true, userId: true } } },
    distinct: ["patientId"],
  });

  let sent = 0;
  for (const record of patients) {
    if (record.patient.email) {
      await notificationProvider.send({
        to: record.patient.email,
        subject: `Health check-up reminder - ${condition}`,
        message: `Dear ${record.patient.name}, ${message}`,
      });
      sent++;
    }
    if (record.patient.userId) {
      await prisma.notification.create({
        data: {
          userId: record.patient.userId,
          type: "GENERAL",
          title: `Health check-up reminder - ${condition}`,
          message,
        },
      });
    }
  }

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "PATIENTS", metadata: { campaign: "recall", condition, sent } },
  });

  return { ok: true, sent, totalTagged: patients.length };
}
