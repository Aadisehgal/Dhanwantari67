export const dynamic = "force-dynamic";

import { getCalendarFeed } from "@/actions/appointments";
import { AppointmentCalendar } from "@/components/calendar/AppointmentCalendar";
import { BookAppointmentForm } from "@/components/calendar/BookAppointmentForm";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek } from "date-fns";

export default async function AppointmentsPage() {
  const start = startOfWeek(new Date());
  const end = endOfWeek(new Date());

  const [{ appointments }, patients, doctors] = await Promise.all([
    getCalendarFeed(start.toISOString(), end.toISOString()),
    prisma.patient.findMany({ take: 100, orderBy: { createdAt: "desc" }, select: { id: true, name: true, uhid: true } }),
    prisma.doctor.findMany({ include: { user: { select: { name: true } } } }),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">This Week's Calendar</h1>
      </div>

      <details className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
        <summary className="cursor-pointer font-semibold text-brand-700">+ Book New Appointment</summary>
        <div className="mt-4">
          <BookAppointmentForm
            patients={patients}
            doctors={doctors.map((d) => ({ id: d.id, user: d.user }))}
          />
        </div>
      </details>

      <AppointmentCalendar appointments={appointments as any} />
    </div>
  );
}
