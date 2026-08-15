"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkIn, checkOut } from "@/actions/hr";

export function AttendanceWidget({
  staffId,
  todayCheckIn,
  todayCheckOut,
}: {
  staffId: string;
  todayCheckIn: string | null;
  todayCheckOut: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleCheckIn() {
    setSubmitting(true);
    await checkIn(staffId);
    setSubmitting(false);
    router.refresh();
  }

  async function handleCheckOut() {
    setSubmitting(true);
    await checkOut(staffId);
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <h3 className="mb-3 font-semibold">Today's Attendance</h3>
      <div className="mb-3 flex gap-4 text-sm text-neutral-600 dark:text-neutral-300">
        <span>Check-in: {todayCheckIn ? new Date(todayCheckIn).toLocaleTimeString() : "-"}</span>
        <span>Check-out: {todayCheckOut ? new Date(todayCheckOut).toLocaleTimeString() : "-"}</span>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleCheckIn}
          disabled={submitting || !!todayCheckIn}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          Check In
        </button>
        <button
          onClick={handleCheckOut}
          disabled={submitting || !todayCheckIn || !!todayCheckOut}
          className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-50"
        >
          Check Out
        </button>
      </div>
    </div>
  );
}
