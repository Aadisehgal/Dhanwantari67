export const dynamic = "force-dynamic";

import Link from "next/link";
import { getLabWorklist } from "@/actions/lab";
import { LabWorklist } from "@/components/lab/LabWorklist";

export default async function LabPage() {
  const orders = await getLabWorklist();

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">Laboratory Worklist</h1>
        <Link href="/dashboard/lab/order" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          + Order Test
        </Link>
      </div>

      <LabWorklist orders={orders as any} />
    </div>
  );
}
