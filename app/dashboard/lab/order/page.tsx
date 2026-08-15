export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { listLabTests } from "@/actions/lab";
import { OrderLabTestForm } from "@/components/lab/OrderLabTestForm";

export default async function OrderLabTestPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const { patientId } = await searchParams;
  const [patients, tests, doctors] = await Promise.all([
    prisma.patient.findMany({ take: 100, orderBy: { createdAt: "desc" }, select: { id: true, name: true, uhid: true } }),
    listLabTests(),
    prisma.doctor.findMany({ include: { user: { select: { name: true } } } }),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Order Lab Test</h1>
      <OrderLabTestForm patients={patients} tests={tests} doctors={doctors.map((d) => ({ id: d.id, user: d.user }))} preselectedPatientId={patientId} />
    </div>
  );
}
