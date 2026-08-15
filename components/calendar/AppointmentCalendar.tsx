"use client";

import { useState, useTransition } from "react";
import { rescheduleAppointment, cancelAppointment, markArrived } from "@/actions/appointments";

interface AppointmentRow {
  id: string;
  scheduledAt: string;
  status: string;
  reason: string | null;
  patient: { name: string; uhid: string; phone: string };
  doctor: { user: { name: string } };
  token: { tokenNumber: number } | null;
}

const STATUS_COLORS: Record<string, string> = {
  BOOKED: "bg-neutral-100 text-neutral-700",
  ARRIVED: "bg-amber-100 text-amber-800",
  IN_CONSULTATION: "bg-accent-50 text-accent-600",
  COMPLETED: "bg-brand-50 text-brand-700",
  CANCELLED: "bg-red-50 text-status-alert line-through",
  NO_SHOW: "bg-red-50 text-status-alert",
};

export function AppointmentCalendar({ appointments }: { appointments: AppointmentRow[] }) {
  const [items, setItems] = useState(appointments);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReschedule(id: string, newTime: string) {
    startTransition(async () => {
      const res = await rescheduleAppointment(id, newTime);
      if (res.ok) {
        setItems((prev) =>
          prev.map((a) => (a.id === id ? { ...a, scheduledAt: res.appointment.scheduledAt as any } : a))
        );
      }
    });
  }

  function handleCancel(id: string) {
    startTransition(async () => {
      const res = await cancelAppointment(id);
      if (res.ok) {
        setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a)));
      }
    });
  }

  function handleArrived(id: string) {
    startTransition(async () => {
      const res = await markArrived(id);
      if (res.ok) {
        setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: "ARRIVED" } : a)));
      }
    });
  }

  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div
          key={a.id}
          className={`rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 ${STATUS_COLORS[a.status] ?? ""}`}
        >
          <button
            className="flex w-full items-center justify-between text-left"
            onClick={() => setExpanded(expanded === a.id ? null : a.id)}
          >
            <div>
              <p className="font-semibold">
                {new Date(a.scheduledAt).toLocaleString()} — {a.patient.name}
                {a.token && <span className="ml-2 text-xs">Token #{a.token.tokenNumber}</span>}
              </p>
              <p className="text-xs opacity-70">Dr. {a.doctor.user.name} · {a.reason ?? "General visit"}</p>
            </div>
            <span className="text-xs font-medium uppercase">{a.status}</span>
          </button>

          {expanded === a.id && (
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-black/5 pt-3">
              <input
                type="datetime-local"
                disabled={isPending}
                defaultValue={new Date(a.scheduledAt).toISOString().slice(0, 16)}
                onBlur={(e) => e.target.value && handleReschedule(a.id, e.target.value)}
                className="input w-auto"
              />
              {a.status === "BOOKED" && (
                <button
                  onClick={() => handleArrived(a.id)}
                  disabled={isPending}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
                >
                  Mark Arrived
                </button>
              )}
              <button
                onClick={() => handleCancel(a.id)}
                disabled={isPending}
                className="rounded-lg border border-status-alert px-3 py-1.5 text-xs font-medium text-status-alert"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
      {items.length === 0 && (
        <p className="p-6 text-center text-neutral-400">No appointments in this range.</p>
      )}
    </div>
  );
}
