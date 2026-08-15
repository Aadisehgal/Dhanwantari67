"use client";

import { useState, useTransition } from "react";
import { collectSample, enterResult, releaseReport } from "@/actions/lab";

interface LabOrderRow {
  id: string;
  status: string;
  sampleBarcode: string | null;
  patient: { name: string; uhid: string };
  test: { name: string; normalRange: string | null; unit: string | null };
  orderedByDoctor: { user: { name: string } } | null;
}

export function LabWorklist({ orders }: { orders: LabOrderRow[] }) {
  const [items, setItems] = useState(orders);
  const [resultDrafts, setResultDrafts] = useState<Record<string, string>>({});
  const [releasedIds, setReleasedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleCollect(id: string) {
    startTransition(async () => {
      const res = await collectSample(id);
      if (res.ok) {
        setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status: "SAMPLE_COLLECTED", sampleBarcode: res.order!.sampleBarcode } : o)));
      }
    });
  }

  function handleEnterResult(id: string) {
    const value = resultDrafts[id];
    if (!value) return;
    startTransition(async () => {
      const res = await enterResult({ labOrderId: id, value });
      if (res.ok) {
        setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status: "COMPLETED" } : o)));
      }
    });
  }

  function handleRelease(id: string) {
    startTransition(async () => {
      const res = await releaseReport(id);
      if (res.ok) setReleasedIds((prev) => [...prev, id]);
    });
  }

  return (
    <div className="space-y-2">
      {items.map((o) => (
        <div key={o.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="font-semibold">{o.test.name} - {o.patient.name}</p>
              <p className="text-xs text-neutral-500">
                {o.patient.uhid} {o.orderedByDoctor && `- Dr. ${o.orderedByDoctor.user.name}`}
                {o.sampleBarcode && ` - Barcode: ${o.sampleBarcode}`}
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium dark:bg-neutral-800">{o.status.replace("_", " ")}</span>
          </div>

          {o.status === "ORDERED" && (
            <button onClick={() => handleCollect(o.id)} disabled={isPending} className="rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-medium text-white">
              Collect Sample
            </button>
          )}

          {o.status === "SAMPLE_COLLECTED" && (
            <div className="flex items-center gap-2">
              <input
                className="input max-w-[140px]"
                placeholder={`Result${o.test.unit ? ` (${o.test.unit})` : ""}`}
                value={resultDrafts[o.id] ?? ""}
                onChange={(e) => setResultDrafts((prev) => ({ ...prev, [o.id]: e.target.value }))}
              />
              {o.test.normalRange && <span className="text-xs text-neutral-400">Normal: {o.test.normalRange}</span>}
              <button onClick={() => handleEnterResult(o.id)} disabled={isPending || !resultDrafts[o.id]} className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white">
                Save Result
              </button>
            </div>
          )}

          {o.status === "COMPLETED" && (
            <div className="flex gap-2">
              {!releasedIds.includes(o.id) ? (
                <button onClick={() => handleRelease(o.id)} disabled={isPending} className="rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-medium text-white">
                  Release Report
                </button>
              ) : (
                <a href={`/api/lab-orders/${o.id}/pdf`} target="_blank" className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white">
                  Print Report
                </a>
              )}
            </div>
          )}
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-neutral-400">No pending lab orders.</p>}
    </div>
  );
}
