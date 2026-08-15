"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dischargePatient } from "@/actions/ipd";

export function DischargeForm({ admissionId, doctorId }: { admissionId: string; doctorId?: string }) {
  const router = useRouter();
  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [treatmentSummary, setTreatmentSummary] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ invoiceId: string; days: number; roomCharges: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await dischargePatient({
      admissionId,
      finalDiagnosis,
      treatmentSummary,
      followUpInstructions: followUpInstructions || undefined,
      followUpDate: followUpDate || undefined,
      dischargedByDoctorId: doctorId,
    });

    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? "Could not process discharge");
      return;
    }

    setResult({ invoiceId: res.invoice!.id, days: res.days!, roomCharges: res.roomCharges! });
    router.refresh();
  }

  if (result) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-6">
        <p className="mb-2 font-semibold text-brand-700">Patient discharged successfully</p>
        <p className="mb-4 text-sm text-neutral-600">
          Room charges: {result.days} day(s) x rate = Rs {result.roomCharges.toFixed(2)}
        </p>
        <div className="flex gap-3">
          <a href={`/dashboard/billing/${result.invoiceId}`} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            View / Pay Invoice
          </a>
          <a href={`/api/admissions/${admissionId}/discharge-summary/pdf`} target="_blank" className="rounded-lg border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-700">
            Print Discharge Summary
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <h3 className="font-semibold">Discharge Patient</h3>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Final Diagnosis</span>
        <input className="input" value={finalDiagnosis} onChange={(e) => setFinalDiagnosis(e.target.value)} required />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Treatment Summary</span>
        <textarea className="input" rows={3} value={treatmentSummary} onChange={(e) => setTreatmentSummary(e.target.value)} required />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Follow-up Instructions</span>
        <textarea className="input" rows={2} value={followUpInstructions} onChange={(e) => setFollowUpInstructions(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Follow-up Date</span>
        <input type="date" className="input" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
      </label>

      {error && <p className="text-sm text-status-alert">{error}</p>}

      <button type="submit" disabled={submitting} className="w-full rounded-lg bg-status-alert py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
        {submitting ? "Processing..." : "Confirm Discharge"}
      </button>
    </form>
  );
}
