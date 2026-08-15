export const dynamic = "force-dynamic";

import { MedicineBatchForm } from "@/components/pharmacy/MedicineBatchForm";

export default function NewBatchPage() {
  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Add Stock Batch</h1>
      <div className="mx-auto max-w-2xl">
        <MedicineBatchForm />
      </div>
    </div>
  );
}
