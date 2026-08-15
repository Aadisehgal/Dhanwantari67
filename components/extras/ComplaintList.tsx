"use client";

import { useState, useTransition } from "react";
import { updateComplaintStatus } from "@/actions/complaints";

interface ComplaintRow {
  id: string;
  subject: string;
  description: string;
  status: string;
  slaDeadline: string;
  createdAt: string;
  patient: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-red-50 text-status-alert",
  IN_PROGRESS: "bg-amber-50 text-amber-800",
  RESOLVED: "bg-brand-50 text-brand-700",
  CLOSED: "bg-neutral-100 text-neutral-500",
};

export function ComplaintList({ complaints }: { complaints: ComplaintRow[] }) {
  const [items, setItems] = useState(complaints);
  const [isPending, startTransition] = useTransition();

  function handleUpdate(id: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") {
    startTransition(async () => {
      await updateComplaintStatus(id, status);
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    });
  }

  return (
    <div className="space-y-2">
      {items.map((c) => {
        const breached = new Date(c.slaDeadline) < new Date() && c.status !== "RESOLVED" && c.status !== "CLOSED";
        return (
          <div key={c.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="mb-1 flex items-center justify-between">
              <p className="font-semibold">{c.subject}{c.patient && ` - ${c.patient.name}`}</p>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[c.status]}`}>{c.status.replace("_", " ")}</span>
            </div>
            <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-300">{c.description}</p>
            <p className={`mb-2 text-xs ${breached ? "font-semibold text-status-alert" : "text-neutral-400"}`}>
              SLA: {new Date(c.slaDeadline).toLocaleString()} {breached && "- BREACHED"}
            </p>
            {c.status !== "RESOLVED" && c.status !== "CLOSED" && (
              <div className="flex gap-2">
                {c.status === "OPEN" && (
                  <button onClick={() => handleUpdate(c.id, "IN_PROGRESS")} disabled={isPending} className="rounded-lg bg-accent-500 px-3 py-1 text-xs font-medium text-white">
                    Start Working
                  </button>
                )}
                <button onClick={() => handleUpdate(c.id, "RESOLVED")} disabled={isPending} className="rounded-lg bg-brand-500 px-3 py-1 text-xs font-medium text-white">
                  Resolve
                </button>
              </div>
            )}
          </div>
        );
      })}
      {items.length === 0 && <p className="text-sm text-neutral-400">No complaints filed.</p>}
    </div>
  );
}
