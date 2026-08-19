"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateDoctor } from "@/actions/doctors";

type Doctor = {
  id: string;
  specialization: string | null;
  qualification: string | null;
  avgConsultMins: number;
  user: { name: string; phone: string | null; isActive: boolean; roleId: string };
};

export function EditDoctorForm({ doctor, roles }: { doctor: Doctor; roles: { id: string; label: string }[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);

    const fd = new FormData(e.currentTarget);
    const result = await updateDoctor(doctor.id, {
      name: String(fd.get("name")),
      phone: String(fd.get("phone") ?? ""),
      specialization: String(fd.get("specialization") ?? ""),
      qualification: String(fd.get("qualification") ?? ""),
      roleId: String(fd.get("roleId")),
      isActive: fd.get("isActive") === "on",
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Failed to update doctor");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-4 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900"
    >
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Full Name</span>
        <input name="name" defaultValue={doctor.user.name} required className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Phone</span>
        <input name="phone" defaultValue={doctor.user.phone ?? ""} className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Specialization</span>
        <input name="specialization" defaultValue={doctor.specialization ?? ""} className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Qualification</span>
        <input name="qualification" defaultValue={doctor.qualification ?? ""} className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Access Level (Role)</span>
        <select name="roleId" defaultValue={doctor.user.roleId} required className="input">
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 self-end pb-2">
        <input type="checkbox" name="isActive" defaultChecked={doctor.user.isActive} className="h-4 w-4" />
        <span className="text-sm">Active (can log in)</span>
      </label>

      {error && <p className="col-span-2 text-sm text-status-alert">{error}</p>}
      {saved && <p className="col-span-2 text-sm text-green-600">Saved.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="col-span-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
