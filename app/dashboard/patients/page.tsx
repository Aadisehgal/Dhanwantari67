export const dynamic = "force-dynamic";

import Link from "next/link";
import { searchPatients } from "@/actions/patients";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const patients = await searchPatients(q ?? "");

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">Patients</h1>
        <Link
          href="/dashboard/patients/new"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          + New Patient
        </Link>
      </div>

      <form className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, phone, or UHID..."
          className="input max-w-md"
        />
      </form>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left dark:bg-neutral-800">
            <tr>
              <th className="p-3">UHID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Gender</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="p-3 font-mono text-xs">{p.uhid}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.phone}</td>
                <td className="p-3">{p.gender ?? "—"}</td>
                <td className="p-3">
                  <Link href={`/dashboard/patients/${p.id}`} className="text-brand-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-400">
                  No patients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
