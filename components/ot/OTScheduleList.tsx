"use client";

import { useState, useTransition } from "react";
import { updateOTStatus } from "@/actions/ot";

interface OTBookingRow {
  id: string;
  otRoom: string;
  procedureName: string;
  scheduledAt: string;
  durationMins: number;
  status: string;
  patient: { name: string; uhid: string };
  surgeon: { user: { name: string } };
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-neutral-100 text-neutral-700",
  IN_PROGRESS: "bg-accent-50 text-accent-600",
  COMPLETED: "bg-brand-50 text-brand-700",
  CANCELLED: "bg-red-50 text-status-alert",
};

export function OTScheduleList({ bookings }: { bookings: OTBookingRow[] }) {
  const [items, setItems] = useState(bookings);
  const [isPending, startTransition] = useTransition();

  function handleStatus(id: string, status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED") {
    startTransition(async () => {
      const res = await updateOTStatus(id, status);
      if (res.ok) {
        setItems((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      }
    });
  }

  return (
    <div className="space-y-2">
      {items.map((b) => (
        <div key={b.id} className={`rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 ${STATUS_COLORS[b.status]}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{b.procedureName} — {b.patient.name}</p>
              <p className="text-xs opacity-70">
                {b.otRoom} · Dr. {b.surgeon.user.name} · {new Date(b.scheduledAt).toLocaleString()} ({b.durationMins} min)
              </p>
            </div>
            <span className="text-xs font-medium uppercase">{b.status}</span>
          </div>

          {b.status === "SCHEDULED" && (
            <div className="mt-2 flex gap-2">
              <button onClick={() => handleStatus(b.id, "IN_PROGRESS")} disabled={isPending} className="rounded-lg bg-accent-500 px-3 py-1 text-xs font-medium text-white">
                Start
              </button>
              <button onClick={() => handleStatus(b.id, "CANCELLED")} disabled={isPending} className="rounded-lg border border-status-alert px-3 py-1 text-xs font-medium text-status-alert">
                Cancel
              </button>
            </div>
          )}
          {b.status === "IN_PROGRESS" && (
            <div className="mt-2">
              <button onClick={() => handleStatus(b.id, "COMPLETED")} disabled={isPending} className="rounded-lg bg-brand-500 px-3 py-1 text-xs font-medium text-white">
                Mark Completed
              </button>
            </div>
          )}
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-neutral-400">No OT bookings in this range.</p>}
    </div>
  );
}
