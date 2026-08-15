"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { orderLabTests } from "@/actions/lab";

export function OrderLabTestForm({
  patients,
  tests,
  doctors,
  preselectedPatientId,
}: {
  patients: { id: string; name: string; uhid: string }[];
  tests: { id: string; name: string; category: string | null; price: unknown }[];
  doctors: { id: string; user: { name: string } }[];
  preselectedPatientId?: string;
}) {
  const router = useRouter();
  const [patientId, setPatientId] = useState(preselectedPatientId ?? patients[0]?.id ?? "");
  const [doctorId, setDoctorId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function toggle(testId: string) {
    setSelected((prev) => (prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const res = await orderLabTests(patientId, selected, doctorId || undefined);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? "Could not place order");
      return;
    }

    setSuccess(true);
    setSelected([]);
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Patient</span>
          <select className="input" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Ordering Doctor</span>
          <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">Unassigned</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>Dr. {d.user.name}</option>)}
          </select>
        </label>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">Select Tests</span>
        <div className="grid grid-cols-2 gap-2">
          {tests.map((t) => (
            <label key={t.id} className="flex items-center gap-2 rounded-lg border border-neutral-100 p-2 text-sm dark:border-neutral-800">
              <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggle(t.id)} />
              <span>{t.name}</span>
              <span className="ml-auto text-xs text-neutral-400">Rs {Number(t.price).toFixed(0)}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-status-alert">{error}</p>}
      {success && <p className="text-sm text-brand-600">Order placed successfully.</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || selected.length === 0}
        className="w-full rounded-lg bg-brand-500 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {submitting ? "Placing Order..." : `Order ${selected.length || ""} Test${selected.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
