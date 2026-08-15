"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyLeave } from "@/actions/hr";
import type { LeaveType } from "@prisma/client";

const LEAVE_TYPES: LeaveType[] = ["CASUAL", "SICK", "EARNED", "UNPAID"];

export function LeaveRequestForm({ staffId }: { staffId: string }) {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState<LeaveType>("CASUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setSubmitting(true);
    await applyLeave(staffId, leaveType, startDate, endDate, reason || undefined);
    setSubmitting(false);
    setStartDate("");
    setEndDate("");
    setReason("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Leave Type</span>
        <select className="input" value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)}>
          {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Reason</span>
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Start Date</span>
        <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">End Date</span>
        <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
      </label>
      <button type="submit" disabled={submitting} className="col-span-2 rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
        {submitting ? "Submitting..." : "Apply for Leave"}
      </button>
    </form>
  );
}
