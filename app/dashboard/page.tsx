export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDashboardSummary } from "@/actions/reports";
import { RoleStatWidgets } from "@/components/dashboard/RoleStatWidgets";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string;
  const branchId = (session.user as any).branchId as string | undefined;
  const name = session.user.name;
  const doctors = await prisma.doctor.findMany({ include: { user: { select: { name: true } } } });
  const stats = branchId ? await getDashboardSummary(branchId) : null;

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="text-2xl font-bold text-brand-700">Welcome, {name}</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-500">Role: {role}</p>

      {stats && <RoleStatWidgets role={role} stats={stats} />}

      <div className="grid grid-cols-3 gap-4">
        <NavCard href="/dashboard/patients" title="Patients" desc="Register & search UHID records" />
        <NavCard href="/dashboard/appointments" title="Calendar & Appointments" desc="Book, reschedule, recurring visits" />
        <NavCard href="/dashboard/pharmacy" title="Pharmacy & Inventory" desc="Stock, barcode, low-stock/expiry alerts" />
        <NavCard href="/dashboard/billing" title="Billing" desc="GST invoices, payments, printable bills" />
        <NavCard href="/dashboard/ipd" title="IPD — Wards & Beds" desc="Admission, nursing notes, discharge" />
        <NavCard href="/dashboard/ot" title="Operation Theatre" desc="OT booking, surgeon schedule" />
        <NavCard href="/dashboard/lab" title="Laboratory" desc="Order tests, results, printable reports" />
        <NavCard href="/dashboard/hr" title="HR & Payroll" desc="Attendance, roster, leaves, payslips" />
        <NavCard href="/dashboard/reports" title="Reports & Analytics" desc="Revenue, occupancy, diagnoses, workload" />
        <NavCard href="/dashboard/announcements" title="Announcements" desc="Hospital notice board for staff" />
        <NavCard href="/dashboard/feedback" title="Feedback & NPS" desc="Patient ratings, doctor satisfaction scores" />
        <NavCard href="/dashboard/complaints" title="Complaints" desc="Grievance tickets with SLA tracking" />
        <NavCard href="/dashboard/vaccinations" title="Vaccination Tracker" desc="Due-date reminders per patient" />
        <NavCard href="/dashboard/chronic-registry" title="Chronic Disease Registry" desc="Tag patients, run recall campaigns" />
        <NavCard href="/dashboard/settings/audit-logs" title="Audit Log" desc="Who changed what, when (admin only)" />
        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
          <h3 className="mb-2 font-semibold">Live Queue Boards</h3>
          <ul className="space-y-1 text-sm">
            {doctors.map((d) => (
              <li key={d.id}>
                <Link href={`/dashboard/queue/${d.id}`} className="text-brand-600 hover:underline">
                  Dr. {d.user.name}
                </Link>
              </li>
            ))}
            {doctors.length === 0 && <li className="text-neutral-400">No doctors yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function NavCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-brand-500 dark:bg-neutral-900"
    >
      <h3 className="mb-1 font-semibold text-brand-700">{title}</h3>
      <p className="text-sm text-neutral-500">{desc}</p>
    </Link>
  );
}
