"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInvoice, type InvoiceLineInput } from "@/actions/billing";
import { lookupByBarcode } from "@/actions/pharmacy";
import { BarcodeScanner } from "@/components/pharmacy/BarcodeScanner";

const CATEGORIES: InvoiceLineInput["category"][] = ["CONSULTATION", "PHARMACY", "LAB", "PROCEDURE", "ROOM_CHARGE", "OTHER"];

export function InvoiceBuilder({ patients }: { patients: { id: string; name: string; uhid: string }[] }) {
  const router = useRouter();
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [lines, setLines] = useState<InvoiceLineInput[]>([
    { category: "CONSULTATION", description: "OPD Consultation Fee", quantity: 1, unitPrice: 500, gstPercent: 0 },
  ]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(idx: number, field: keyof InvoiceLineInput, value: string | number) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  }

  function addBlankLine() {
    setLines((prev) => [...prev, { category: "OTHER", description: "", quantity: 1, unitPrice: 0, gstPercent: 0 }]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleBarcodeScan(code: string) {
    setScannerOpen(false);
    const batch = await lookupByBarcode(code);
    if (!batch) {
      setError(`No medicine found for barcode ${code}`);
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        category: "PHARMACY",
        description: `${batch.brandName} (Batch ${batch.batchNo})`,
        quantity: 1,
        unitPrice: Number(batch.mrp),
        gstPercent: Number(batch.gstPercent),
      },
    ]);
  }

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const gstTotal = lines.reduce((s, l) => s + (l.quantity * l.unitPrice * l.gstPercent) / 100, 0);
  const grandTotal = subtotal + gstTotal;

  async function handleSubmit() {
    if (!patientId || lines.length === 0) return;
    setSubmitting(true);
    setError(null);

    const res = await createInvoice(patientId, lines);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? "Could not create invoice");
      return;
    }

    router.push(`/dashboard/billing/${res.invoice!.id}`);
  }

  return (
    <div className="space-y-6">
      <label className="block max-w-md">
        <span className="mb-1 block text-sm font-medium">Patient</span>
        <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="input">
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
          ))}
        </select>
      </label>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Line Items</h2>
          <div className="flex gap-2">
            <button onClick={() => setScannerOpen((s) => !s)} className="rounded-lg border border-brand-500 px-3 py-1.5 text-xs font-medium text-brand-700">
              📷 Scan Medicine Barcode
            </button>
            <button onClick={addBlankLine} className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600">
              + Add Line
            </button>
          </div>
        </div>

        {scannerOpen && (
          <div className="mb-4">
            <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setScannerOpen(false)} />
          </div>
        )}

        <div className="space-y-2">
          {lines.map((l, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-neutral-100 p-2 text-sm dark:border-neutral-800">
              <select className="input col-span-2" value={l.category} onChange={(e) => updateLine(idx, "category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="input col-span-4" placeholder="Description" value={l.description} onChange={(e) => updateLine(idx, "description", e.target.value)} />
              <input type="number" className="input col-span-1" value={l.quantity} onChange={(e) => updateLine(idx, "quantity", Number(e.target.value))} />
              <input type="number" step="0.01" className="input col-span-2" value={l.unitPrice} onChange={(e) => updateLine(idx, "unitPrice", Number(e.target.value))} />
              <input type="number" step="0.01" className="input col-span-2" value={l.gstPercent} onChange={(e) => updateLine(idx, "gstPercent", Number(e.target.value))} />
              <button onClick={() => removeLine(idx)} className="col-span-1 text-status-alert">✕</button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>GST</span><span>₹{gstTotal.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-neutral-200 pt-1 font-semibold"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-status-alert">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || lines.length === 0}
          className="mt-4 w-full rounded-lg bg-brand-500 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? "Creating Invoice..." : "Generate Invoice"}
        </button>
      </div>
    </div>
  );
}
