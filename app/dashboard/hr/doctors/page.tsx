export const dynamic = "force-dynamic";

import Link from "next/link";
import { listDoctors, listAssignableRoles } from "@/actions/doctors";
import { AddDoctorForm } from "@/components/hr/AddDoctorForm";

export default async function DoctorsPage() {
  const [doctors, roles] = await Promise.all([listDoctors(), listAssignableRoles()]);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">Doctors</h1>
        <AddDoctorForm roles={roles} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-left dark:bg-neutral-800">
              <th className="p-3">Name</th>
              <th className="p-3">Specialization</th>
              <th className="p-3">Qualification</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d.id} className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="p-3 font-medium">Dr. {d.user.name}</td>
                <td className="p-3">{d.specialization ?? "—"}</td>
                <td className="p-3">{d.qualification ?? "—"}</td>
                <td className="p-3">{d.user.role.label}</td>
                <td className="p-3">
                  {d.user.isActive ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-neutral-400">Inactive</span>
                  )}
                </td>
                <td className="p-3">
                  <Link href={`/dashboard/hr/doctors/${d.id}`} className="text-brand-600 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-neutral-400">
                  No doctors added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
