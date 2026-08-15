"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, branchScope } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(title: string, content: string) {
  const session = await requirePermission("SETTINGS", "CREATE");
  const branchId = session.branchId;
  if (!branchId) return { ok: false, error: "No branch assigned" };

  const announcement = await prisma.announcement.create({
    data: { branchId, title, content, createdById: session.userId },
  });

  revalidatePath("/dashboard/announcements");
  return { ok: true, announcement };
}

export async function listAnnouncements() {
  const session = await requirePermission("DASHBOARD", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  return prisma.announcement.findMany({ where: scope, orderBy: { createdAt: "desc" }, take: 20 });
}
