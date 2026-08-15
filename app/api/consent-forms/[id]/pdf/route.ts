import { NextRequest, NextResponse } from "next/server";
import { getConsentForm } from "@/actions/consent";
import { generateConsentPDF } from "@/lib/pdf/consent-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await getConsentForm(id);

  if (!form) {
    return NextResponse.json({ error: "Consent form not found" }, { status: 404 });
  }

  const hospital = form.patient.branch.hospital;

  const pdfBuffer = await generateConsentPDF({
    hospitalName: hospital.name,
    hospitalAddress: hospital.address ?? undefined,
    formType: form.formType,
    content: form.content,
    patientName: form.patient.name,
    patientUHID: form.patient.uhid,
    signerName: form.signerName,
    signerRelation: form.signerRelation,
    witnessName: form.witnessName ?? undefined,
    signatureDataUrl: form.signatureDataUrl,
    signedAt: new Date(form.signedAt).toLocaleString(),
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="consent-${form.id}.pdf"`,
    },
  });
}
