export const dynamic = "force-dynamic";

import { PatientForm } from "@/components/patients/PatientForm";

export default function NewPatientPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <PatientForm />
    </div>
  );
}
