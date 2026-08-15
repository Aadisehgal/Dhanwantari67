export const dynamic = "force-dynamic";

import Link from "next/link";
import { listInvoices } from "@/actions/billing";

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-brand-50 text-brand-700",
  PENDING: "bg-amber-50 text-amber-800",
  PARTIALLY_PAID: "bg-amber-50 text-amber-800",
  CANCELLED: "bg-red-50 text-status-alert",
  REFUNDED: "bg-accent-50 text-accent-600",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const invoices = await listInvoices(q);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">Billing</h1>
        <Link href="/dashboard/billing/new" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          + New Invoice
        </Link>
      </div>

      <form className="mb-6">
        <input name="q" defaultValue={q} placeholder="Search invoice no. or patient name..." className="input max-w-md" />
      </form>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left dark:bg-neutral-800">
            <tr>
              <th className="p-3">Invoice No.</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="p-3 font-mono text-xs">{inv.invoiceNo}</td>
                <td className="p-3">{inv.patient.name}</td>
                <td className="p-3">₹{Number(inv.totalAmount).toFixed(2)}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[inv.status]}`}>{inv.status.replace("_", " ")}</span></td>
                <td className="p-3">{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td className="p-3"><Link href={`/dashboard/billing/${inv.id}`} className="text-brand-600 hover:underline">View</Link></td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-neutral-400">No invoices found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
