"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const VIEW_ROLES = ["SUPER_ADMIN", "HOSPITAL_ADMIN", "BRANCH_ADMIN"];

export async function getAuditLogs(filters: { module?: string; userId?: string; days?: number }) {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  if (!role || !VIEW_ROLES.includes(role)) {
    throw new Error("Only admin roles can view the audit log");
  }

  const since = filters.days
    ? new Date(Date.now() - filters.days * 24 * 60 * 60 * 1000)
    : undefined;

  return prisma.auditLog.findMany({
    where: {
      ...(filters.module ? { module: filters.module } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
