"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMedicineBatch } from "@/actions/pharmacy";

export function MedicineBatchForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBarcode, setCreatedBarcode] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const res = await createMedicineBatch({
      brandName: String(fd.get("brandName")),
      genericName: String(fd.get("genericName") ?? ""),
      batchNo: String(fd.get("batchNo")),
      expiryDate: String(fd.get("expiryDate")),
      purchasePrice: Number(fd.get("purchasePrice")),
      mrp: Number(fd.get("mrp")),
      gstPercent: Number(fd.get("gstPercent")),
      stockQty: Number(fd.get("stockQty")),
      minStockQty: Number(fd.get("minStockQty")),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? "Could not add batch");
      return;
    }

    setCreatedBarcode(res.batch!.barcode);
    router.refresh();
  }

  if (createdBarcode) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-6 text-center">
        <p className="mb-2 font-semibold text-brand-700">Batch added successfully</p>
        <p className="mb-1 text-sm text-neutral-600">Generated barcode (print as a label on the pack):</p>
        <p className="font-mono text-lg tracking-widest">{createdBarcode}</p>
        <button
          onClick={() => setCreatedBarcode(null)}
          className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Add Another Batch
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 rounded-xl border border-neutral-200 bg-white p-6 dark:bg-neutral-900">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Brand Name</span>
        <input name="brandName" required className="input" placeholder="Paracetamol" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Generic Name</span>
        <input name="genericName" className="input" placeholder="Acetaminophen" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Batch No.</span>
        <input name="batchNo" required className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Expiry Date</span>
        <input type="date" name="expiryDate" required className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Purchase Price (₹)</span>
        <input type="number" step="0.01" name="purchasePrice" required className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">MRP (₹)</span>
        <input type="number" step="0.01" name="mrp" required className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">GST %</span>
        <input type="number" step="0.01" name="gstPercent" defaultValue={12} required className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Stock Quantity</span>
        <input type="number" name="stockQty" required className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Minimum Stock Alert Level</span>
        <input type="number" name="minStockQty" defaultValue={10} required className="input" />
      </label>

      {error && <p className="col-span-2 text-sm text-status-alert">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="col-span-2 rounded-lg bg-brand-500 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Add Stock Batch"}
      </button>
    </form>
  );
}
