"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookOT } from "@/actions/ot";

export function OTBookingForm({
  patients,
  surgeons,
}: {
  patients: { id: string; name: string; uhid: string }[];
  surgeons: { id: string; user: { name: string } }[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const res = await bookOT({
      patientId: String(fd.get("patientId")),
      surgeonId: String(fd.get("surgeonId")),
      otRoom: String(fd.get("otRoom")),
      procedureName: String(fd.get("procedureName")),
      scheduledAt: String(fd.get("scheduledAt")),
      durationMins: Number(fd.get("durationMins")),
      notes: String(fd.get("notes") ?? ""),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? "Could not book OT slot");
      return;
    }

    router.refresh();
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Patient</span>
        <select name="patientId" required className="input">
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Surgeon</span>
        <select name="surgeonId" required className="input">
          {surgeons.map((s) => <option key={s.id} value={s.id}>Dr. {s.user.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">OT Room</span>
        <input name="otRoom" required className="input" placeholder="OT-1" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Procedure</span>
        <input name="procedureName" required className="input" placeholder="Appendectomy" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Date & Time</span>
        <input type="datetime-local" name="scheduledAt" required className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Duration (minutes)</span>
        <input type="number" name="durationMins" defaultValue={60} required className="input" />
      </label>
      <label className="col-span-2 block">
        <span className="mb-1 block text-sm font-medium">Notes</span>
        <textarea name="notes" className="input" rows={2} />
      </label>

      {error && <p className="col-span-2 text-sm text-status-alert">{error}</p>}

      <button type="submit" disabled={submitting} className="col-span-2 rounded-lg bg-brand-500 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
        {submitting ? "Booking..." : "Book OT Slot"}
      </button>
    </form>
  );
}
