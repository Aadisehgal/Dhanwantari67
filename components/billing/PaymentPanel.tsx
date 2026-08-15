"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordPayment } from "@/actions/billing";
import type { PaymentMode } from "@prisma/client";

const MODES: PaymentMode[] = ["CASH", "CARD", "UPI", "INSURANCE", "BANK_TRANSFER", "WALLET"];

export function PaymentPanel({ invoiceId, balanceDue }: { invoiceId: string; balanceDue: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(balanceDue.toFixed(2));
  const [mode, setMode] = useState<PaymentMode>("CASH");
  const [referenceNo, setReferenceNo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await recordPayment(invoiceId, Number(amount), mode, referenceNo || undefined);
    setSubmitting(false);
    router.refresh();
  }

  if (balanceDue <= 0) {
    return <p className="rounded-lg bg-brand-50 p-3 text-sm font-medium text-brand-700">Fully paid ✓</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <h3 className="font-semibold">Record Payment</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Amount</span>
          <input type="number" step="0.01" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Mode</span>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)}>
            {MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Reference No. (optional)</span>
        <input className="input" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Transaction/UTR/cheque no." />
      </label>
      <button type="submit" disabled={submitting} className="w-full rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
        {submitting ? "Recording..." : "Record Payment"}
      </button>
    </form>
  );
}
