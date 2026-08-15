export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { InvoiceBuilder } from "@/components/billing/InvoiceBuilder";

export default async function NewInvoicePage() {
  const patients = await prisma.patient.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, uhid: true },
  });

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">New Invoice</h1>
      <InvoiceBuilder patients={patients} />
    </div>
  );
}
