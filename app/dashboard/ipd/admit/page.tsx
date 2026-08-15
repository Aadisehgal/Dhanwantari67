export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdmissionForm } from "@/components/ipd/AdmissionForm";

export default async function AdmitPatientPage({
  searchParams,
}: {
  searchParams: Promise<{ bedId?: string }>;
}) {
  const { bedId } = await searchParams;
  const session = await auth();
  const branchId = (session?.user as any)?.branchId as string | undefined;

  const [patients, doctors, vacantBedsRaw] = await Promise.all([
    prisma.patient.findMany({ take: 100, orderBy: { createdAt: "desc" }, select: { id: true, name: true, uhid: true } }),
    prisma.doctor.findMany({ include: { user: { select: { name: true } } } }),
    prisma.bed.findMany({
      where: { status: "VACANT", ward: { branchId } },
      include: { ward: { select: { name: true } } },
    }),
  ]);

  const vacantBeds = vacantBedsRaw.map((b) => ({ id: b.id, label: b.label, wardName: b.ward.name }));

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Admit Patient</h1>
      <AdmissionForm patients={patients} doctors={doctors.map((d) => ({ id: d.id, user: d.user }))} vacantBeds={vacantBeds} preselectedBedId={bedId} />
    </div>
  );
}
