import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { generatePrescriptionPDF } from "@/lib/pdf/prescription-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission("OPD", "EXPORT");
  const { id } = await params;

  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      items: true,
      doctor: { include: { user: true } },
      emr: {
        include: {
          diagnoses: true,
          patient: { include: { branch: { include: { hospital: true } } } },
        },
      },
    },
  });

  if (!prescription) {
    return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
  }

  const patient = prescription.emr.patient;
  const hospital = patient.branch.hospital;
  const origin = req.nextUrl.origin;

  const pdfBuffer = await generatePrescriptionPDF({
    hospitalName: hospital.name,
    hospitalAddress: hospital.address ?? undefined,
    gstNo: hospital.gstNo ?? undefined,
    doctorName: `Dr. ${prescription.doctor.user.name}`,
    doctorQualification: prescription.doctor.qualification ?? undefined,
    signatureUrl: prescription.doctor.signatureUrl ?? undefined,
    patientName: patient.name,
    patientUHID: patient.uhid,
    patientGender: patient.gender ?? undefined,
    date: new Date(prescription.createdAt).toLocaleDateString(),
    diagnoses: prescription.emr.diagnoses.map((d) => ({ code: d.icd10Code, label: d.label })),
    items: prescription.items.map((it) => ({
      medicineName: it.medicineName,
      dosage: it.dosage,
      frequency: it.frequency,
      durationDays: it.durationDays,
      instructions: it.instructions ?? undefined,
    })),
    qrPayload: `${origin}/patient-portal/prescriptions/${prescription.id}`,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="prescription-${prescription.id}.pdf"`,
    },
  });
}
