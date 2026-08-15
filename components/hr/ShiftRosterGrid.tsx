"use client";

import { useState, useTransition } from "react";
import { assignShift } from "@/actions/hr";
import type { ShiftType } from "@prisma/client";

interface RosterCell {
  staffId: string;
  date: string;
  shiftType: ShiftType;
}

const SHIFT_COLORS: Record<ShiftType, string> = {
  MORNING: "bg-amber-50 text-amber-800",
  EVENING: "bg-accent-50 text-accent-600",
  NIGHT: "bg-neutral-800 text-white",
  OFF: "bg-neutral-100 text-neutral-400",
};

const SHIFT_OPTIONS: ShiftType[] = ["MORNING", "EVENING", "NIGHT", "OFF"];

export function ShiftRosterGrid({
  staff,
  dates,
  initialRoster,
}: {
  staff: { id: string; name: string }[];
  dates: string[];
  initialRoster: RosterCell[];
}) {
  const [roster, setRoster] = useState<Record<string, ShiftType>>(() => {
    const map: Record<string, ShiftType> = {};
    for (const r of initialRoster) map[`${r.staffId}_${r.date}`] = r.shiftType;
    return map;
  });
  const [isPending, startTransition] = useTransition();

  function handleAssign(staffId: string, date: string, shiftType: ShiftType) {
    setRoster((prev) => ({ ...prev, [`${staffId}_${date}`]: shiftType }));
    startTransition(async () => {
      await assignShift(staffId, date, shiftType);
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:bg-neutral-900">
      <table className="w-full text-sm">
        <thead className="bg-neutral-100 text-left dark:bg-neutral-800">
          <tr>
            <th className="p-3">Staff</th>
            {dates.map((d) => (
              <th key={d} className="p-3 text-center">{new Date(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id} className="border-t border-neutral-100 dark:border-neutral-800">
              <td className="p-3 font-medium">{s.name}</td>
              {dates.map((d) => {
                const key = `${s.id}_${d}`;
                const current = roster[key] ?? "OFF";
                return (
                  <td key={d} className="p-2 text-center">
                    <select
                      value={current}
                      disabled={isPending}
                      onChange={(e) => handleAssign(s.id, d, e.target.value as ShiftType)}
                      className={`rounded px-2 py-1 text-xs font-medium ${SHIFT_COLORS[current]}`}
                    >
                      {SHIFT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
