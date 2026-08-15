export const dynamic = "force-dynamic";

import { listLeaveRequests } from "@/actions/hr";
import { LeaveRequestForm } from "@/components/hr/LeaveRequestForm";
import { LeaveApprovalList } from "@/components/hr/LeaveApprovalList";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function LeavesPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  const [leaves, myStaff] = await Promise.all([
    listLeaveRequests(),
    userId ? prisma.staff.findUnique({ where: { userId } }) : null,
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Leave Requests</h1>

      {myStaff && (
        <div className="mb-6">
          <LeaveRequestForm staffId={myStaff.id} />
        </div>
      )}

      <h2 className="mb-3 font-semibold text-neutral-700">All Requests</h2>
      <LeaveApprovalList leaves={leaves as any} />
    </div>
  );
}
