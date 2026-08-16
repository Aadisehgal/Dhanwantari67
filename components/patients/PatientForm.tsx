"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { patientSchema, type PatientFormValues } from "@/lib/validators/patient";
import { createPatient, type CreatePatientResult } from "@/actions/patients";

export function PatientForm() {
  const router = useRouter();
  const [duplicates, setDuplicates] = useState<CreatePatientResult["duplicates"]>(undefined);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { allergies: [], forceCreate: false },
  });

  const [ageInput, setAgeInput] = useState("");
  const dobValue = watch("dob");

  // Typing an age fills in an approximate date of birth (Jan 1 of the birth year).
  function handleAgeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const age = e.target.value;
    setAgeInput(age);
    const parsedAge = parseInt(age, 10);
    if (age && !Number.isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 130) {
      const birthYear = new Date().getFullYear() - parsedAge;
      setValue("dob", `${birthYear}-01-01`, { shouldValidate: true });
    }
  }

  // Typing an exact DOB clears the approximate age helper so they don't fight each other.
  useEffect(() => {
    if (dobValue) setAgeInput("");
  }, [dobValue]);

  async function submit(values: PatientFormValues, force = false) {
    setSubmitting(true);
    setServerError(null);

    const result = await createPatient({ ...values, forceCreate: force });

    setSubmitting(false);

    if (!result.ok && result.duplicates?.length) {
      setDuplicates(result.duplicates);
      return;
    }
    if (!result.ok) {
      setServerError(result.error ?? "Something went wrong");
      return;
    }

    router.push(`/dashboard/patients/${result.patientId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit((v) => submit(v, false))} className="mx-auto max-w-2xl space-y-6 p-6">
      <h2 className="text-xl font-bold text-brand-700">New Patient Registration</h2>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name" error={errors.name?.message}>
          <input {...register("name")} className="input" placeholder="Ramesh Kumar" />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input {...register("phone")} className="input" placeholder="9876543210" />
        </Field>
        <Field label="Date of Birth">
          <input type="date" {...register("dob")} className="input" />
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-neutral-500">or just enter age:</span>
            <input
              type="number"
              min={0}
              max={130}
              value={ageInput}
              onChange={handleAgeChange}
              placeholder="Age"
              className="input w-20 py-1 text-sm"
            />
            <span className="text-xs text-neutral-500">years</span>
          </div>
        </Field>
        <Field label="Gender">
          <select {...register("gender")} className="input">
            <option value="">Select</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
        <Field label="Email">
          <input type="email" {...register("email")} className="input" placeholder="optional" />
        </Field>
        <Field label="Blood Group">
          <select {...register("bloodGroup")} className="input">
            <option value="">Select</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </Field>
        <Field label="Govt ID Number">
          <input {...register("govtIdNumber")} className="input" placeholder="Aadhaar / other" />
        </Field>
        <Field label="Family Code (optional)">
          <input {...register("familyId")} className="input" placeholder="Shared family billing ID" />
        </Field>
      </div>

      <Field label="Address">
        <textarea {...register("address")} className="input" rows={2} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Emergency Contact Name">
          <input {...register("emergencyName")} className="input" />
        </Field>
        <Field label="Emergency Contact Phone">
          <input {...register("emergencyPhone")} className="input" />
        </Field>
      </div>

      {serverError && <p className="text-sm text-status-alert">{serverError}</p>}

      {duplicates && duplicates.length > 0 && (
        <div className="rounded-lg border border-status-pending bg-amber-50 p-4">
          <p className="mb-2 text-sm font-semibold text-amber-800">
            Possible existing patient records found:
          </p>
          <ul className="mb-3 space-y-1 text-sm text-amber-800">
            {duplicates.map((d) => (
              <li key={d.patientId}>
                {d.name} — {d.uhid} — {d.phone} (matched on {d.matchedOn.join(", ")}, score{" "}
                {(d.score * 100).toFixed(0)}%)
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => submit(getValues(), true)}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              This is a new patient — register anyway
            </button>
            <button
              type="button"
              onClick={() => setDuplicates(undefined)}
              className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800"
            >
              Cancel, let me check
            </button>
          </div>
        </div>
      )}

      {!duplicates?.length && (
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-500 px-6 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? "Checking..." : "Register Patient"}
        </button>
      )}
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-status-alert">{error}</span>}
    </label>
  );
}
