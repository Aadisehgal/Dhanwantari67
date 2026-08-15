"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, branchScope } from "@/lib/permissions";
import { selectFEFOBatches, generateBatchBarcode, getLowStockAlerts, getExpiryAlerts, getExpiredBatches } from "@/lib/pharmacy-utils";
import { revalidatePath } from "next/cache";

export interface NewBatchInput {
  brandName: string;
  genericName?: string;
  batchNo: string;
  expiryDate: string;
  purchasePrice: number;
  mrp: number;
  gstPercent: number;
  stockQty: number;
  minStockQty: number;
}

export async function createMedicineBatch(input: NewBatchInput) {
  const session = await requirePermission("PHARMACY", "CREATE");
  const branchId = session.branchId;
  if (!branchId) return { ok: false, error: "No branch assigned" };

  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: branchId }, select: { code: true } });
  const barcode = generateBatchBarcode(branch.code, input.batchNo);

  const batch = await prisma.medicineBatch.create({
    data: {
      branchId,
      brandName: input.brandName,
      genericName: input.genericName,
      batchNo: input.batchNo,
      expiryDate: new Date(input.expiryDate),
      purchasePrice: input.purchasePrice,
      mrp: input.mrp,
      gstPercent: input.gstPercent,
      stockQty: input.stockQty,
      minStockQty: input.minStockQty,
      barcode,
    },
  });

  await prisma.stockMovement.create({
    data: {
      medicineBatchId: batch.id,
      type: "PURCHASE_IN",
      quantity: input.stockQty,
      note: "Initial stock entry",
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "PHARMACY", metadata: { batchId: batch.id } },
  });

  revalidatePath("/dashboard/pharmacy");
  return { ok: true, batch };
}

export async function searchMedicineBatches(query: string) {
  const session = await requirePermission("PHARMACY", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  return prisma.medicineBatch.findMany({
    where: {
      ...scope,
      OR: [
        { brandName: { contains: query, mode: "insensitive" } },
        { genericName: { contains: query, mode: "insensitive" } },
        { barcode: { contains: query } },
        { batchNo: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { expiryDate: "asc" },
    take: 20,
  });
}

/** Barcode-scan lookup — used at the billing counter and dispensing screen. */
export async function lookupByBarcode(barcode: string) {
  await requirePermission("PHARMACY", "VIEW");
  return prisma.medicineBatch.findUnique({ where: { barcode } });
}

/**
 * Dispenses a prescription: for each item, selects FEFO batches, deducts
 * stock, and records a StockMovement + Dispense/DispenseItem trail.
 * Optionally links to an invoice for billing.
 */
export async function dispensePrescription(
  prescriptionId: string,
  branchId: string,
  invoiceId?: string
) {
  const session = await requirePermission("PHARMACY", "CREATE");

  const prescription = await prisma.prescription.findUniqueOrThrow({
    where: { id: prescriptionId },
    include: { items: true },
  });

  const dispense = await prisma.dispense.create({
    data: { prescriptionId, invoiceId, dispensedBy: session.userId },
  });

  const dispensedLines: { medicineName: string; quantity: number; unitPrice: number }[] = [];

  for (const item of prescription.items) {
    // Interpret "quantity" as durationDays (1 unit/day) unless a number prefix
    // is present in the dosage — simple heuristic for demo purposes.
    const quantity = item.durationDays || 1;

    const plan = await selectFEFOBatches(branchId, item.medicineName, quantity);

    for (const p of plan) {
      const batch = await prisma.medicineBatch.update({
        where: { id: p.batchId },
        data: { stockQty: { decrement: p.qty } },
      });

      await prisma.stockMovement.create({
        data: {
          medicineBatchId: p.batchId,
          type: "DISPENSE_OUT",
          quantity: -p.qty,
          reference: prescriptionId,
          note: `Dispensed for prescription ${prescriptionId}`,
        },
      });

      await prisma.dispenseItem.create({
        data: { dispenseId: dispense.id, medicineBatchId: p.batchId, quantity: p.qty },
      });

      dispensedLines.push({ medicineName: item.medicineName, quantity: p.qty, unitPrice: Number(batch.mrp) });
    }
  }

  revalidatePath("/dashboard/pharmacy");
  return { ok: true, dispenseId: dispense.id, dispensedLines };
}

export async function recordInternalConsumption(
  medicineBatchId: string,
  department: string,
  quantity: number,
  reason?: string
) {
  await requirePermission("PHARMACY", "CREATE");

  await prisma.medicineBatch.update({
    where: { id: medicineBatchId },
    data: { stockQty: { decrement: quantity } },
  });

  await prisma.stockMovement.create({
    data: { medicineBatchId, type: "INTERNAL_CONSUMPTION", quantity: -quantity, note: `${department}: ${reason ?? ""}` },
  });

  await prisma.internalConsumption.create({
    data: { medicineBatchId, department, quantity, reason },
  });

  revalidatePath("/dashboard/pharmacy");
  return { ok: true };
}

export async function getPharmacyAlerts() {
  const session = await requirePermission("PHARMACY", "VIEW");
  const branchId = session.branchId;
  if (!branchId) return { lowStock: [], expiringSoon: [], expired: [] };

  const [lowStock, expiringSoon, expired] = await Promise.all([
    getLowStockAlerts(branchId),
    getExpiryAlerts(branchId, 60),
    getExpiredBatches(branchId),
  ]);

  return { lowStock, expiringSoon, expired };
}
