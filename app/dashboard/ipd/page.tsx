export const dynamic = "force-dynamic";

import Link from "next/link";
import { getWardOccupancy } from "@/actions/ipd";
import { WardBoard } from "@/components/ipd/WardBoard";
import { auth } from "@/lib/auth";

export default async function IPDPage() {
  const session = await auth();
  const branchId = (session?.user as any)?.branchId as string | undefined;

  if (!branchId) {
    return <p className="p-8 text-status-alert">No branch assigned to this account.</p>;
  }

  const wards = await getWardOccupancy(branchId);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">IPD — Ward & Bed Occupancy</h1>
        <Link href="/dashboard/ipd/admit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          + Admit Patient
        </Link>
      </div>

      <WardBoard wards={wards as any} />
    </div>
  );
}
