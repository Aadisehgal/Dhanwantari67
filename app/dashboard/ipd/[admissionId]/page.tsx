export const dynamic = "force-dynamic";

import { getAdmissionDetail } from "@/actions/ipd";
import { notFound } from "next/navigation";
import { NursingNotesPanel } from "@/components/ipd/NursingNotesPanel";
import { DischargeForm } from "@/components/ipd/DischargeForm";
import { ConsentFormBuilder } from "@/components/ipd/ConsentFormBuilder";

export default async function AdmissionDetailPage({
  params,
}: {
  params: Promise<{ admissionId: string }>;
}) {
  const { admissionId } = await params;
  const admission = await getAdmissionDetail(admissionId);
  if (!admission) notFound();

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-700">{admission.patient.name}</h1>
        <p className="text-sm text-neutral-500">
          {admission.bed.ward.name} / Bed {admission.bed.label} - Admitted {new Date(admission.admittedAt).toLocaleString()}
          {admission.admittingDoctor && ` - Dr. ${admission.admittingDoctor.user.name}`}
        </p>
        {admission.diagnosis && <p className="mt-1 text-sm text-neutral-600">Diagnosis: {admission.diagnosis}</p>}
        <span className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {admission.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <NursingNotesPanel admissionId={admission.id} notes={admission.nursingNotes as any} />
          <ConsentFormBuilder patientId={admission.patientId} admissionId={admission.id} />
        </div>

        <div>
          {admission.status === "ADMITTED" ? (
            <DischargeForm admissionId={admission.id} doctorId={admission.admittingDoctorId ?? undefined} />
          ) : admission.dischargeSummary ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
              <h3 className="mb-2 font-semibold">Discharge Summary</h3>
              <p className="mb-1 text-sm"><strong>Final Diagnosis:</strong> {admission.dischargeSummary.finalDiagnosis}</p>
              <p className="mb-3 text-sm"><strong>Treatment:</strong> {admission.dischargeSummary.treatmentSummary}</p>
              <a
                href={`/api/admissions/${admission.id}/discharge-summary/pdf`}
                target="_blank"
                className="inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Print Discharge Summary
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
