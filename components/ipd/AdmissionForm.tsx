"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { admitPatient } from "@/actions/ipd";

interface VacantBed {
  id: string;
  label: string;
  wardName: string;
}

export function AdmissionForm({
  patients,
  doctors,
  vacantBeds,
  preselectedBedId,
}: {
  patients: { id: string; name: string; uhid: string }[];
  doctors: { id: string; user: { name: string } }[];
  vacantBeds: VacantBed[];
  preselectedBedId?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const res = await admitPatient(
      String(fd.get("patientId")),
      String(fd.get("bedId")),
      String(fd.get("admittingDoctorId")) || undefined,
      String(fd.get("diagnosis") || "")
    );

    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? "Could not admit patient");
      return;
    }

    router.push(`/dashboard/ipd/${res.admission!.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-xl border border-neutral-200 bg-white p-6 dark:bg-neutral-900">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Patient</span>
        <select name="patientId" required className="input">
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>)}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Bed</span>
        <select name="bedId" required defaultValue={preselectedBedId} className="input">
          <option value="">Select vacant bed</option>
          {vacantBeds.map((b) => <option key={b.id} value={b.id}>{b.wardName} — {b.label}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Admitting Doctor</span>
        <select name="admittingDoctorId" className="input">
          <option value="">Unassigned</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>Dr. {d.user.name}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Admission Diagnosis</span>
        <textarea name="diagnosis" className="input" rows={3} />
      </label>

      {error && <p className="text-sm text-status-alert">{error}</p>}

      <button type="submit" disabled={submitting} className="w-full rounded-lg bg-brand-500 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
        {submitting ? "Admitting..." : "Admit Patient"}
      </button>
    </form>
  );
}
