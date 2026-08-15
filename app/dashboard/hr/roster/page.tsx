export const dynamic = "force-dynamic";

import { listStaff, getWeekRoster } from "@/actions/hr";
import { ShiftRosterGrid } from "@/components/hr/ShiftRosterGrid";
import { startOfWeek, addDays } from "date-fns";

export default async function RosterPage() {
  const weekStart = startOfWeek(new Date());
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i).toISOString().slice(0, 10));

  const [staffList, roster] = await Promise.all([
    listStaff(),
    getWeekRoster(dates[0]!, dates[6]!),
  ]);

  const initialRoster = roster.map((r) => ({
    staffId: r.staffId,
    date: r.date.toISOString().slice(0, 10),
    shiftType: r.shiftType,
  }));

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Shift Roster - This Week</h1>
      <ShiftRosterGrid
        staff={staffList.map((s) => ({ id: s.id, name: s.user.name }))}
        dates={dates}
        initialRoster={initialRoster}
      />
    </div>
  );
}
