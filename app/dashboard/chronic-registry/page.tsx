export const dynamic = "force-dynamic";

import { listChronicRegistry, getConditionSummary, tagChronicCondition } from "@/actions/chronic-registry";
import { RecallCampaignForm } from "@/components/extras/RecallCampaignForm";
import { prisma } from "@/lib/prisma";

async function handleTag(formData: FormData) {
  "use server";
  const patientId = String(formData.get("patientId"));
  const condition = String(formData.get("condition"));
  const notes = String(formData.get("notes") || "");
  if (patientId && condition) await tagChronicCondition(patientId, condition, undefined, notes || undefined);
}

const COMMON_CONDITIONS = ["Diabetes", "Hypertension", "Cardiac", "Thyroid", "Asthma", "Chronic Kidney Disease"];

export default async function ChronicRegistryPage() {
  const [registry, conditionSummary, patients] = await Promise.all([
    listChronicRegistry(),
    getConditionSummary(),
    prisma.patient.findMany({ take: 50, orderBy: { createdAt: "desc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Chronic Disease Registry</h1>

      <div className="mb-6 grid grid-cols-2 gap-6">
        <form action={handleTag} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
          <h3 className="font-semibold">Tag Patient</h3>
          <select name="patientId" required className="input">
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input name="condition" list="conditions" placeholder="Condition" required className="input" />
          <datalist id="conditions">
            {COMMON_CONDITIONS.map((c) => <option key={c} value={c} />)}
          </datalist>
          <textarea name="notes" placeholder="Notes (optional)" rows={2} className="input" />
          <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            Add to Registry
          </button>
        </form>

        {conditionSummary.length > 0 ? (
          <RecallCampaignForm conditions={conditionSummary} />
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-400">
            Tag patients with a condition to enable recall campaigns.
          </div>
        )}
      </div>

      <h2 className="mb-3 font-semibold text-neutral-700">Registry ({registry.length})</h2>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left dark:bg-neutral-800">
            <tr>
              <th className="p-3">Patient</th>
              <th className="p-3">Condition</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {registry.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="p-3">{r.patient.name} ({r.patient.uhid})</td>
                <td className="p-3">{r.condition}</td>
                <td className="p-3 text-xs text-neutral-500">{r.patient.phone}{r.patient.email ? ` / ${r.patient.email}` : ""}</td>
                <td className="p-3 text-xs text-neutral-500">{r.notes ?? "-"}</td>
              </tr>
            ))}
            {registry.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-neutral-400">No patients tagged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
