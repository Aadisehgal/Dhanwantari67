"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookAppointment } from "@/actions/appointments";

export function BookAppointmentForm({
  patients,
  doctors,
}: {
  patients: { id: string; name: string; uhid: string }[];
  doctors: { id: string; user: { name: string } }[];
}) {
  const router = useRouter();
  const [recurring, setRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const res = await bookAppointment({
      patientId: String(fd.get("patientId")),
      doctorId: String(fd.get("doctorId")),
      scheduledAt: String(fd.get("scheduledAt")),
      reason: String(fd.get("reason") ?? ""),
      isFollowUp: false,
      recurrence: recurring
        ? {
            frequency: fd.get("frequency") as "DAILY" | "WEEKLY",
            count: Number(fd.get("count")),
          }
        : null,
    });

    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? "Could not book appointment");
      return;
    }

    router.refresh();
    e.currentTarget.closest("details")?.removeAttribute("open");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Patient</span>
          <select name="patientId" required className="input">
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.uhid})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Doctor</span>
          <select name="doctorId" required className="input">
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.user.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Date & Time</span>
        <input type="datetime-local" name="scheduledAt" required className="input" />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Reason</span>
        <input name="reason" className="input" placeholder="Follow-up, general checkup, ..." />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
        Recurring (physiotherapy / dialysis / chemo schedule)
      </label>

      {recurring && (
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Frequency</span>
            <select name="frequency" className="input">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Number of sessions</span>
            <input type="number" name="count" min={2} max={60} defaultValue={4} className="input" />
          </label>
        </div>
      )}

      {error && <p className="text-sm text-status-alert">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-500 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {submitting ? "Booking..." : "Book Appointment"}
      </button>
    </form>
  );
}
