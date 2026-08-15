export const dynamic = "force-dynamic";

import { getUpcomingVaccinations, scheduleVaccination } from "@/actions/vaccinations";
import { VaccinationDueList } from "@/components/extras/VaccinationDueList";
import { prisma } from "@/lib/prisma";

async function handleSchedule(formData: FormData) {
  "use server";
  const patientId = String(formData.get("patientId"));
  const vaccineName = String(formData.get("vaccineName"));
  const doseNumber = Number(formData.get("doseNumber"));
  const dueDate = String(formData.get("dueDate"));
  if (patientId && vaccineName && dueDate) await scheduleVaccination(patientId, vaccineName, doseNumber, dueDate);
}

export default async function VaccinationsPage() {
  const [records, patients] = await Promise.all([
    getUpcomingVaccinations(60),
    prisma.patient.findMany({ take: 50, orderBy: { createdAt: "desc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Vaccination Tracker</h1>

      <form action={handleSchedule} className="mb-6 grid grid-cols-4 gap-3 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
        <select name="patientId" required className="input">
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input name="vaccineName" placeholder="Vaccine name" required className="input" />
        <input type="number" name="doseNumber" placeholder="Dose #" defaultValue={1} min={1} required className="input" />
        <input type="date" name="dueDate" required className="input" />
        <button type="submit" className="col-span-4 rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          Schedule Vaccination
        </button>
      </form>

      <h2 className="mb-3 font-semibold text-neutral-700">Due in Next 60 Days</h2>
      <VaccinationDueList records={records as any} />
    </div>
  );
}
