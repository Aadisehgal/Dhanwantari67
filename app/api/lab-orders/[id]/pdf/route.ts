import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { generateLabReportPDF } from "@/lib/pdf/lab-report-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission("LAB", "EXPORT");
  const { id } = await params;

  const order = await prisma.labOrder.findUnique({
    where: { id },
    include: {
      patient: { include: { branch: { include: { hospital: true } } } },
      test: true,
      result: true,
      orderedByDoctor: { include: { user: { select: { name: true } } } },
    },
  });

  if (!order || !order.result) {
    return NextResponse.json({ error: "Report not available yet" }, { status: 404 });
  }

  const hospital = order.patient.branch.hospital;

  const pdfBuffer = await generateLabReportPDF({
    hospitalName: hospital.name,
    hospitalAddress: hospital.address ?? undefined,
    patientName: order.patient.name,
    patientUHID: order.patient.uhid,
    patientGender: order.patient.gender ?? undefined,
    orderedByDoctor: order.orderedByDoctor ? `Dr. ${order.orderedByDoctor.user.name}` : undefined,
    sampleCollectedAt: order.sampleCollectedAt ? new Date(order.sampleCollectedAt).toLocaleString() : undefined,
    releasedAt: order.result.releasedAt ? new Date(order.result.releasedAt).toLocaleString() : undefined,
    tests: [
      {
        name: order.test.name,
        value: order.result.value,
        unit: order.result.unit ?? undefined,
        normalRange: order.result.normalRangeAtRun ?? undefined,
        isAbnormal: order.result.isAbnormal,
        remarks: order.result.remarks ?? undefined,
      },
    ],
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lab-report-${order.id}.pdf"`,
    },
  });
}
