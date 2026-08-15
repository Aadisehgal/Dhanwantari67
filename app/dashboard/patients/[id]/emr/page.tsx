export const dynamic = "force-dynamic";

import { getEMRTimeline } from "@/actions/opd";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EMRTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({ where: { id }, select: { name: true, uhid: true } });
  if (!patient) notFound();

  const timeline = await getEMRTimeline(id);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-1 text-2xl font-bold text-brand-700">EMR Timeline — {patient.name}</h1>
      <p className="mb-6 font-mono text-xs text-neutral-500">{patient.uhid}</p>

      <div className="space-y-4">
        {timeline.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {entry.visitType}
              </span>
              <span className="text-xs text-neutral-400">{new Date(entry.createdAt).toLocaleString()}</span>
            </div>

            {entry.diagnoses.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-semibold text-neutral-500">DIAGNOSIS</p>
                <div className="flex flex-wrap gap-2">
                  {entry.diagnoses.map((d) => (
                    <span key={d.id} className="rounded-full bg-accent-50 px-3 py-1 text-xs text-accent-600">
                      {d.icd10Code} — {d.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {entry.notes && <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-300">{entry.notes}</p>}

            {entry.prescriptions.map((rx) => (
              <div key={rx.id} className="mt-2 rounded-lg bg-neutral-50 p-3 text-sm dark:bg-neutral-800">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">Prescribed by Dr. {rx.doctor.user.name}</span>
                  <Link href={`/api/prescriptions/${rx.id}/pdf`} target="_blank" className="text-xs text-brand-600 hover:underline">
                    View PDF
                  </Link>
                </div>
                <ul className="ml-4 list-disc text-neutral-600 dark:text-neutral-300">
                  {rx.items.map((item) => (
                    <li key={item.id}>
                      {item.medicineName} — {item.dosage}, {item.frequency}, {item.durationDays} days
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}

        {timeline.length === 0 && (
          <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-400">
            No EMR entries yet — start an OPD consultation to build this patient's timeline.
          </p>
        )}
      </div>
    </div>
  );
}
