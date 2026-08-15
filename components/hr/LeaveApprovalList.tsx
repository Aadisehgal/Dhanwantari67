"use client";

import { useState, useTransition } from "react";
import { reviewLeave } from "@/actions/hr";

interface LeaveRow {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  staff: { user: { name: string } };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  APPROVED: "bg-brand-50 text-brand-700",
  REJECTED: "bg-red-50 text-status-alert",
};

export function LeaveApprovalList({ leaves }: { leaves: LeaveRow[] }) {
  const [items, setItems] = useState(leaves);
  const [isPending, startTransition] = useTransition();

  function handleReview(id: string, decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const res = await reviewLeave(id, decision);
      if (res.ok) {
        setItems((prev) => prev.map((l) => (l.id === id ? { ...l, status: decision } : l)));
      }
    });
  }

  return (
    <div className="space-y-2">
      {items.map((l) => (
        <div key={l.id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div>
            <p className="font-semibold">{l.staff.user.name} - {l.leaveType}</p>
            <p className="text-xs text-neutral-500">
              {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
              {l.reason && ` - ${l.reason}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[l.status]}`}>{l.status}</span>
            {l.status === "PENDING" && (
              <>
                <button onClick={() => handleReview(l.id, "APPROVED")} disabled={isPending} className="rounded-lg bg-brand-500 px-3 py-1 text-xs font-medium text-white">
                  Approve
                </button>
                <button onClick={() => handleReview(l.id, "REJECTED")} disabled={isPending} className="rounded-lg border border-status-alert px-3 py-1 text-xs font-medium text-status-alert">
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-neutral-400">No leave requests.</p>}
    </div>
  );
}
