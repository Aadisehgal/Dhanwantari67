export const dynamic = "force-dynamic";

import { getPatientById } from "@/actions/patients";
import { notFound } from "next/navigation";

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatientById(id);
  if (!patient) notFound();

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">{patient.name}</h1>
          <p className="font-mono text-xs text-neutral-500">{patient.uhid}</p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/dashboard/opd/${patient.id}`}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Start OPD Consultation
          </a>
          <a
            href={`/dashboard/patients/${patient.id}/emr`}
            className="rounded-lg border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-700"
          >
            View EMR Timeline
          </a>
          <a
            href={`/dashboard/lab/order?patientId=${patient.id}`}
            className="rounded-lg border border-accent-500 px-4 py-2 text-sm font-semibold text-accent-600"
          >
            Order Lab Test
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
            <h2 className="mb-3 font-semibold">Demographics</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Info label="Phone" value={patient.phone} />
              <Info label="Gender" value={patient.gender ?? "—"} />
              <Info label="Blood Group" value={patient.bloodGroup ?? "—"} />
              <Info label="DOB" value={patient.dob ? new Date(patient.dob).toLocaleDateString() : "—"} />
              <Info label="Allergies" value={patient.allergies.join(", ") || "None recorded"} />
              <Info label="Address" value={patient.address ?? "—"} />
            </dl>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
            <h2 className="mb-3 font-semibold">Recent Appointments</h2>
            {patient.appointments.length === 0 && (
              <p className="text-sm text-neutral-400">No appointments yet.</p>
            )}
            <ul className="space-y-2 text-sm">
              {patient.appointments.map((a) => (
                <li key={a.id} className="flex justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
                  <span>Dr. {a.doctor.user.name}</span>
                  <span>{new Date(a.scheduledAt).toLocaleString()}</span>
                  <span className="text-xs uppercase text-neutral-500">{a.status}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
            <h2 className="mb-3 font-semibold">Vitals Trend</h2>
            {patient.vitals.length === 0 && (
              <p className="text-sm text-neutral-400">No vitals recorded yet.</p>
            )}
            <ul className="space-y-1 text-sm">
              {patient.vitals.map((v) => (
                <li key={v.id} className="flex gap-4 text-neutral-600 dark:text-neutral-300">
                  <span>{new Date(v.recordedAt).toLocaleDateString()}</span>
                  <span>BP {v.bp ?? "—"}</span>
                  <span>Pulse {v.pulse ?? "—"}</span>
                  <span>SpO2 {v.spo2 ?? "—"}</span>
                  <span>BMI {v.bmi ?? "—"}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
          <h2 className="mb-3 font-semibold">Family</h2>
          {patient.family ? (
            <ul className="space-y-1 text-sm">
              {patient.family.members.map((m) => (
                <li key={m.id}>{m.name} ({m.uhid})</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-400">Not linked to a family group.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-neutral-400">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
