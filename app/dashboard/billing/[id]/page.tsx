export const dynamic = "force-dynamic";

import { getInvoiceById } from "@/actions/billing";
import { notFound } from "next/navigation";
import { PaymentPanel } from "@/components/billing/PaymentPanel";

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-brand-50 text-brand-700",
  PENDING: "bg-amber-50 text-amber-800",
  PARTIALLY_PAID: "bg-amber-50 text-amber-800",
  CANCELLED: "bg-red-50 text-status-alert",
  REFUNDED: "bg-accent-50 text-accent-600",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const balanceDue = Number(invoice.totalAmount) - Number(invoice.amountPaid);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">{invoice.invoiceNo}</h1>
          <p className="text-sm text-neutral-500">{invoice.patient.name} · {invoice.patient.uhid}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[invoice.status]}`}>
            {invoice.status.replace("_", " ")}
          </span>
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            🖨️ Print / Download Bill
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="pb-2">Category</th>
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">GST%</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="py-2 text-xs text-neutral-400">{item.category}</td>
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">₹{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="py-2 text-right">{Number(item.gstPercent)}%</td>
                  <td className="py-2 text-right">₹{Number(item.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(invoice.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>GST</span><span>₹{Number(invoice.gstAmount).toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-neutral-200 pt-1 font-semibold"><span>Total</span><span>₹{Number(invoice.totalAmount).toFixed(2)}</span></div>
              <div className="flex justify-between text-neutral-500"><span>Paid</span><span>₹{Number(invoice.amountPaid).toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-status-alert"><span>Balance Due</span><span>₹{balanceDue.toFixed(2)}</span></div>
            </div>
          </div>

          {invoice.payments.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold">Payment History</h3>
              <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                {invoice.payments.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.mode.replace("_", " ")} {p.referenceNo ? `(${p.referenceNo})` : ""}</span>
                    <span>₹{Number(p.amount).toFixed(2)} — {new Date(p.paidAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <PaymentPanel invoiceId={invoice.id} balanceDue={balanceDue} />
      </div>
    </div>
  );
}
