"use server";

import { requirePermission } from "@/lib/permissions";
import { auth } from "@/lib/auth";
import * as analytics from "@/lib/analytics";

export async function getReportsBundle(days = 30) {
  const session = await requirePermission("REPORTS", "VIEW");
  const branchId = session.branchId;
  if (!branchId) return null;

  const [revenueTrend, registrationTrend, paymentModes, bedOccupancy, topDiagnoses, doctorConsultations, pendingDues] =
    await Promise.all([
      analytics.getRevenueTrend(branchId, days),
      analytics.getPatientRegistrationTrend(branchId, days),
      analytics.getPaymentModeBreakdown(branchId),
      analytics.getBedOccupancy(branchId),
      analytics.getTopDiagnoses(branchId),
      analytics.getDoctorConsultationCounts(branchId),
      analytics.getPendingDues(branchId),
    ]);

  return { revenueTrend, registrationTrend, paymentModes, bedOccupancy, topDiagnoses, doctorConsultations, pendingDues };
}

/** Today-at-a-glance stats used on the role-specific home dashboard. Restricted to the caller's own branch unless they hold an admin role. */
export async function getDashboardSummary(branchId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const role = (session.user as any).role as string;
  const callerBranchId = (session.user as any).branchId as string | null;
  const adminRoles = ["SUPER_ADMIN", "HOSPITAL_ADMIN", "BRANCH_ADMIN"];

  if (!adminRoles.includes(role) && callerBranchId !== branchId) {
    throw new Error("You can only view your own branch's dashboard summary");
  }

  return analytics.getTodayStats(branchId);
}
