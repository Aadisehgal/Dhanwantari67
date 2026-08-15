export const dynamic = "force-dynamic";

import { listStaff } from "@/actions/hr";
import { PayslipGenerator } from "@/components/hr/PayslipGenerator";
import { prisma } from "@/lib/prisma";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ staffId?: string }>;
}) {
  const { staffId } = await searchParams;
  const staffList = await listStaff();

  const recentPayslips = await prisma.payslip.findMany({
    include: { staff: { include: { user: { select: { name: true } } } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 20,
  });

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Payroll</h1>

      <div className="mb-6">
        <PayslipGenerator staff={staffList.map((s) => ({ id: s.id, name: s.user.name }))} preselectedStaffId={staffId} />
      </div>

      <h2 className="mb-3 font-semibold text-neutral-700">Recent Payslips</h2>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left dark:bg-neutral-800">
            <tr>
              <th className="p-3">Staff</th>
              <th className="p-3">Month</th>
              <th className="p-3">Net Pay</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {recentPayslips.map((p) => (
              <tr key={p.id} className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="p-3">{p.staff.user.name}</td>
                <td className="p-3">{p.month}/{p.year}</td>
                <td className="p-3">Rs {Number(p.netPay).toFixed(2)}</td>
                <td className="p-3">
                  <a href={`/api/payslips/${p.id}/pdf`} target="_blank" className="text-brand-600 hover:underline">Print</a>
                </td>
              </tr>
            ))}
            {recentPayslips.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-neutral-400">No payslips generated yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
