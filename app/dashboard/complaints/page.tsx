export const dynamic = "force-dynamic";

import { listComplaints, createComplaint } from "@/actions/complaints";
import { ComplaintList } from "@/components/extras/ComplaintList";
import { prisma } from "@/lib/prisma";

async function handleCreate(formData: FormData) {
  "use server";
  const patientId = String(formData.get("patientId") || "") || undefined;
  const subject = String(formData.get("subject"));
  const description = String(formData.get("description"));
  if (subject && description) await createComplaint(patientId, subject, description);
}

export default async function ComplaintsPage() {
  const [complaints, patients] = await Promise.all([
    listComplaints(),
    prisma.patient.findMany({ take: 50, orderBy: { createdAt: "desc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Complaints & Grievances</h1>

      <form action={handleCreate} className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
        <select name="patientId" className="input">
          <option value="">General (not patient-specific)</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input name="subject" placeholder="Subject" required className="input" />
        <textarea name="description" placeholder="Description" rows={3} required className="input col-span-2" />
        <button type="submit" className="col-span-2 rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          File Complaint
        </button>
      </form>

      <ComplaintList complaints={complaints as any} />
    </div>
  );
}
