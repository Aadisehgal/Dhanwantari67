import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { generateDischargeSummaryPDF } from "@/lib/pdf/discharge-summary-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission("IPD", "EXPORT");
  const { id } = await params;

  const admission = await prisma.admission.findUnique({
    where: { id },
    include: {
      patient: { include: { branch: { include: { hospital: true } } } },
      bed: { include: { ward: true } },
      admittingDoctor: { include: { user: { select: { name: true } } } },
      dischargeSummary: true,
    },
  });

  if (!admission || !admission.dischargeSummary) {
    return NextResponse.json({ error: "Discharge summary not found" }, { status: 404 });
  }

  const hospital = admission.patient.branch.hospital;

  const pdfBuffer = await generateDischargeSummaryPDF({
    hospitalName: hospital.name,
    hospitalAddress: hospital.address ?? undefined,
    patientName: admission.patient.name,
    patientUHID: admission.patient.uhid,
    wardBed: `${admission.bed.ward.name} / Bed ${admission.bed.label}`,
    admittedAt: new Date(admission.admittedAt).toLocaleString(),
    dischargedAt: admission.dischargedAt ? new Date(admission.dischargedAt).toLocaleString() : "—",
    admittingDoctor: admission.admittingDoctor ? `Dr. ${admission.admittingDoctor.user.name}` : undefined,
    admissionDiagnosis: admission.diagnosis ?? undefined,
    finalDiagnosis: admission.dischargeSummary.finalDiagnosis,
    treatmentSummary: admission.dischargeSummary.treatmentSummary,
    followUpInstructions: admission.dischargeSummary.followUpInstructions ?? undefined,
    followUpDate: admission.dischargeSummary.followUpDate
      ? new Date(admission.dischargeSummary.followUpDate).toLocaleDateString()
      : undefined,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="discharge-summary-${admission.id}.pdf"`,
    },
  });
}
