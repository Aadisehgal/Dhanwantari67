"use client";

import { useState } from "react";
import { generatePayslip } from "@/actions/hr";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function PayslipGenerator({
  staff,
  preselectedStaffId,
}: {
  staff: { id: string; name: string }[];
  preselectedStaffId?: string;
}) {
  const now = new Date();
  const [staffId, setStaffId] = useState(preselectedStaffId ?? staff[0]?.id ?? "");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string; netPay: number } | null>(null);

  async function handleGenerate() {
    if (!staffId) return;
    setSubmitting(true);
    const res = await generatePayslip(staffId, month, year);
    setSubmitting(false);
    if (res.ok) setResult({ id: res.payslip!.id, netPay: Number(res.payslip!.netPay) });
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <h3 className="mb-3 font-semibold">Generate Payslip</h3>
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Staff</span>
          <select className="input" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Month</span>
          <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Year</span>
          <input type="number" className="input" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </label>
      </div>

      <button onClick={handleGenerate} disabled={submitting} className="mt-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
        {submitting ? "Calculating..." : "Generate Payslip"}
      </button>

      {result && (
        <div className="mt-4 rounded-lg bg-brand-50 p-4">
          <p className="mb-2 text-sm font-semibold text-brand-700">Net Pay: Rs {result.netPay.toFixed(2)}</p>
          <a href={`/api/payslips/${result.id}/pdf`} target="_blank" className="inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            Print Payslip
          </a>
        </div>
      )}
    </div>
  );
}
