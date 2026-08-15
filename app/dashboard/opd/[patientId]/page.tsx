export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { OPDConsultation } from "@/components/opd/OPDConsultation";
import { VitalsTrendChart } from "@/components/opd/VitalsTrendChart";

export default async function OPDPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const session = await auth();

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { vitals: { orderBy: { recordedAt: "asc" }, take: 20 } },
  });
  if (!patient) notFound();

  // Resolve the acting doctor: the logged-in doctor, or fall back to the
  // branch's first doctor (useful for reception-assisted OPD entry).
  const role = (session?.user as any)?.role as string | undefined;
  const userId = (session?.user as any)?.id as string | undefined;

  const doctor =
    role === "DOCTOR" && userId
      ? await prisma.doctor.findUnique({ where: { userId } })
      : await prisma.doctor.findFirst({ where: { user: { branchId: patient.branchId } } });

  if (!doctor) {
    return <p className="p-8 text-status-alert">No doctor available for this branch. Seed a doctor first.</p>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-1 text-2xl font-bold text-brand-700">OPD Consultation — {patient.name}</h1>
      <p className="mb-6 font-mono text-xs text-neutral-500">{patient.uhid}</p>

      {patient.vitals.length > 1 && (
        <div className="mb-6">
          <VitalsTrendChart vitals={patient.vitals as any} />
        </div>
      )}

      <OPDConsultation patientId={patient.id} doctorId={doctor.id} />
    </div>
  );
}
