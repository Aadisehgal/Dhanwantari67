export const dynamic = "force-dynamic";

import Link from "next/link";
import { listStaff } from "@/actions/hr";
import { AttendanceWidget } from "@/components/hr/AttendanceWidget";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";

export default async function HRPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  const [staffList, myStaff] = await Promise.all([
    listStaff(),
    userId ? prisma.staff.findUnique({ where: { userId } }) : null,
  ]);

  let myAttendance = null;
  if (myStaff) {
    myAttendance = await prisma.attendance.findUnique({
      where: { staffId_date: { staffId: myStaff.id, date: startOfDay(new Date()) } },
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">HR - Staff & Attendance</h1>
        <div className="flex gap-3">
          <Link href="/dashboard/hr/doctors" className="rounded-lg border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-700">
            Doctors
          </Link>
          <Link href="/dashboard/hr/roster" className="rounded-lg border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-700">
            Shift Roster
          </Link>
          <Link href="/dashboard/hr/leaves" className="rounded-lg border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-700">
            Leave Requests
          </Link>
          <Link href="/dashboard/hr/payroll" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            Payroll
          </Link>
        </div>
      </div>

      {myStaff && (
        <div className="mb-6">
          <AttendanceWidget
            staffId={myStaff.id}
            todayCheckIn={myAttendance?.checkIn ? myAttendance.checkIn.toISOString() : null}
            todayCheckOut={myAttendance?.checkOut ? myAttendance.checkOut.toISOString() : null}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left dark:bg-neutral-800">
            <tr>
              <th className="p-3">Employee ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Department</th>
              <th className="p-3">Designation</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((s) => (
              <tr key={s.id} className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="p-3 font-mono text-xs">{s.employeeId}</td>
                <td className="p-3">{s.user.name}</td>
                <td className="p-3">{s.user.role.label}</td>
                <td className="p-3">{s.department ?? "-"}</td>
                <td className="p-3">{s.designation ?? "-"}</td>
                <td className="p-3">
                  <Link href={`/dashboard/hr/payroll?staffId=${s.id}`} className="text-brand-600 hover:underline">
                    Payroll
                  </Link>
                </td>
              </tr>
            ))}
            {staffList.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-neutral-400">No staff records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
