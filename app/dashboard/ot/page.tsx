export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getOTSchedule } from "@/actions/ot";
import { OTBookingForm } from "@/components/ot/OTBookingForm";
import { OTScheduleList } from "@/components/ot/OTScheduleList";
import { startOfWeek, endOfWeek } from "date-fns";

export default async function OTPage() {
  const start = startOfWeek(new Date());
  const end = endOfWeek(new Date());

  const [patients, surgeons, bookings] = await Promise.all([
    prisma.patient.findMany({ take: 100, orderBy: { createdAt: "desc" }, select: { id: true, name: true, uhid: true } }),
    prisma.doctor.findMany({ include: { user: { select: { name: true } } } }),
    getOTSchedule(start.toISOString(), end.toISOString()),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Operation Theatre</h1>

      <details className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
        <summary className="cursor-pointer font-semibold text-brand-700">+ Book OT Slot</summary>
        <div className="mt-4">
          <OTBookingForm patients={patients} surgeons={surgeons.map((s) => ({ id: s.id, user: s.user }))} />
        </div>
      </details>

      <h2 className="mb-3 font-semibold text-neutral-700">This Week's Schedule</h2>
      <OTScheduleList bookings={bookings as any} />
    </div>
  );
}
