export const dynamic = "force-dynamic";

import Link from "next/link";
import { searchMedicineBatches, getPharmacyAlerts } from "@/actions/pharmacy";

export default async function PharmacyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [batches, alerts] = await Promise.all([
    searchMedicineBatches(q ?? ""),
    getPharmacyAlerts(),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">Pharmacy & Inventory</h1>
        <Link href="/dashboard/pharmacy/new" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          + Add Stock Batch
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <AlertCard title="Low Stock" count={alerts.lowStock.length} color="amber" items={alerts.lowStock.map((b) => `${b.brandName} (${b.stockQty} left)`)} />
        <AlertCard title="Expiring Soon (60d)" count={alerts.expiringSoon.length} color="amber" items={alerts.expiringSoon.map((b) => `${b.brandName} — ${new Date(b.expiryDate).toLocaleDateString()}`)} />
        <AlertCard title="Expired (still in stock)" count={alerts.expired.length} color="red" items={alerts.expired.map((b) => `${b.brandName} — ${b.stockQty} units`)} />
      </div>

      <form className="mb-6">
        <input name="q" defaultValue={q} placeholder="Search brand, generic, batch no, or scan barcode..." className="input max-w-md" />
      </form>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left dark:bg-neutral-800">
            <tr>
              <th className="p-3">Brand</th>
              <th className="p-3">Batch</th>
              <th className="p-3">Expiry</th>
              <th className="p-3">Stock</th>
              <th className="p-3">MRP</th>
              <th className="p-3">Barcode</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id} className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="p-3">{b.brandName} <span className="text-xs text-neutral-400">{b.genericName}</span></td>
                <td className="p-3">{b.batchNo}</td>
                <td className="p-3">{new Date(b.expiryDate).toLocaleDateString()}</td>
                <td className={`p-3 ${b.stockQty <= b.minStockQty ? "font-semibold text-status-alert" : ""}`}>{b.stockQty}</td>
                <td className="p-3">₹{Number(b.mrp).toFixed(2)}</td>
                <td className="p-3 font-mono text-xs">{b.barcode}</td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-neutral-400">No stock found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertCard({ title, count, color, items }: { title: string; count: number; color: "amber" | "red"; items: string[] }) {
  const colorClasses = color === "amber" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-red-300 bg-red-50 text-status-alert";
  return (
    <div className={`rounded-xl border p-4 ${colorClasses}`}>
      <p className="text-sm font-semibold">{title}: {count}</p>
      <ul className="mt-1 space-y-0.5 text-xs">
        {items.slice(0, 4).map((i, idx) => <li key={idx}>{i}</li>)}
      </ul>
    </div>
  );
}
