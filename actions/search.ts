"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, branchScope } from "@/lib/permissions";

export interface GlobalSearchResult {
  type: "Patient" | "Invoice" | "Medicine";
  label: string;
  href: string;
}

export async function globalSearch(query: string): Promise<GlobalSearchResult[]> {
  const session = await requirePermission("PATIENTS", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  const [patients, invoices, medicines] = await Promise.all([
    prisma.patient.findMany({
      where: { ...scope, OR: [{ name: { contains: query, mode: "insensitive" } }, { phone: { contains: query } }, { uhid: { contains: query, mode: "insensitive" } }] },
      take: 5,
      select: { id: true, name: true, uhid: true },
    }),
    prisma.invoice.findMany({
      where: { ...scope, invoiceNo: { contains: query, mode: "insensitive" } },
      take: 5,
      select: { id: true, invoiceNo: true },
    }),
    prisma.medicineBatch.findMany({
      where: { ...scope, brandName: { contains: query, mode: "insensitive" } },
      take: 5,
      select: { id: true, brandName: true, batchNo: true },
    }),
  ]);

  return [
    ...patients.map((p) => ({ type: "Patient" as const, label: `${p.name} (${p.uhid})`, href: `/dashboard/patients/${p.id}` })),
    ...invoices.map((i) => ({ type: "Invoice" as const, label: i.invoiceNo, href: `/dashboard/billing/${i.id}` })),
    ...medicines.map((m) => ({ type: "Medicine" as const, label: `${m.brandName} (Batch ${m.batchNo})`, href: `/dashboard/pharmacy` })),
  ];
}
