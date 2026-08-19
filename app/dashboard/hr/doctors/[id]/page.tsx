export const dynamic = "force-dynamic";

import { getDoctorById, listAssignableRoles } from "@/actions/doctors";
import { notFound } from "next/navigation";
import { EditDoctorForm } from "@/components/hr/EditDoctorForm";

export default async function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doctor, roles] = await Promise.all([getDoctorById(id), listAssignableRoles()]);

  if (!doctor) notFound();

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Dr. {doctor.user.name}</h1>
      <EditDoctorForm doctor={doctor} roles={roles} />
    </div>
  );
}
