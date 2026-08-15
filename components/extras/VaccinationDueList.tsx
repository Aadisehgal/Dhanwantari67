"use client";

import { useState, useTransition } from "react";
import { markVaccinationGiven } from "@/actions/vaccinations";

interface VaccinationRow {
  id: string;
  vaccineName: string;
  doseNumber: number;
  dueDate: string;
  patient: { name: string; phone: string; uhid: string };
}

export function VaccinationDueList({ records }: { records: VaccinationRow[] }) {
  const [items, setItems] = useState(records);
  const [isPending, startTransition] = useTransition();

  function handleGiven(id: string) {
    startTransition(async () => {
      await markVaccinationGiven(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
    });
  }

  return (
    <div className="space-y-2">
      {items.map((r) => {
        const overdue = new Date(r.dueDate) < new Date();
        return (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div>
              <p className="font-semibold">{r.vaccineName} - Dose {r.doseNumber}</p>
              <p className="text-xs text-neutral-500">{r.patient.name} ({r.patient.uhid}) - {r.patient.phone}</p>
              <p className={`text-xs ${overdue ? "font-semibold text-status-alert" : "text-neutral-400"}`}>
                Due: {new Date(r.dueDate).toLocaleDateString()} {overdue && "- OVERDUE"}
              </p>
            </div>
            <button onClick={() => handleGiven(r.id)} disabled={isPending} className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600">
              Mark Given
            </button>
          </div>
        );
      })}
      {items.length === 0 && <p className="text-sm text-neutral-400">No upcoming vaccinations due.</p>}
    </div>
  );
}
