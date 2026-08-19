"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDoctor } from "@/actions/doctors";

export function AddDoctorForm({ roles }: { roles: { id: string; label: string }[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const result = await createDoctor({
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone") ?? ""),
      password: String(fd.get("password")),
      roleId: String(fd.get("roleId")),
      specialization: String(fd.get("specialization") ?? ""),
      qualification: String(fd.get("qualification") ?? ""),
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Failed to add doctor");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
      >
        + Add Doctor
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900"
    >
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Full Name</span>
        <input name="name" required className="input" placeholder="Dr. Rajesh Kumar" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Phone</span>
        <input name="phone" className="input" placeholder="9876543210" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Login Email</span>
        <input type="email" name="email" required className="input" placeholder="doctor@hospital.com" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Login Password</span>
        <input type="password" name="password" required minLength={6} className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Specialization</span>
        <input name="specialization" className="input" placeholder="Cardiologist" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Qualification</span>
        <input name="qualification" className="input" placeholder="MBBS, MD" />
      </label>
      <label className="col-span-2 block">
        <span className="mb-1 block text-sm font-medium">Access Level (Role)</span>
        <select name="roleId" required className="input">
          <option value="">Select</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-400">
          Controls what this doctor can see/do. Fine-tune per role under Settings → Staff Access & Permissions.
        </p>
      </label>

      {error && <p className="col-span-2 text-sm text-status-alert">{error}</p>}

      <div className="col-span-2 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Doctor"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
