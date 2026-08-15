"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, branchScope } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { addHours } from "date-fns";

export async function createComplaint(patientId: string | undefined, subject: string, description: string, slaHours = 48) {
  const session = await requirePermission("PATIENTS", "CREATE");
  const branchId = session.branchId;
  if (!branchId) return { ok: false, error: "No branch assigned" };

  const complaint = await prisma.complaint.create({
    data: { branchId, patientId, subject, description, slaDeadline: addHours(new Date(), slaHours) },
  });

  revalidatePath("/dashboard/complaints");
  return { ok: true, complaint };
}

export async function updateComplaintStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") {
  await requirePermission("PATIENTS", "EDIT");

  const complaint = await prisma.complaint.update({
    where: { id },
    data: { status, resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : undefined },
  });

  revalidatePath("/dashboard/complaints");
  return { ok: true, complaint };
}

export async function listComplaints() {
  const session = await requirePermission("PATIENTS", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  return prisma.complaint.findMany({
    where: scope,
    include: { patient: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
