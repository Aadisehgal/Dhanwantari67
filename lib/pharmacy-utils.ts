import "server-only";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

/**
 * FEFO batch selection: given a medicine brand name and required quantity,
 * returns the batches to draw from (earliest-expiry-first) until the
 * quantity is satisfied. Throws if insufficient total stock exists.
 */
export async function selectFEFOBatches(branchId: string, brandName: string, quantity: number) {
  const batches = await prisma.medicineBatch.findMany({
    where: { branchId, brandName, stockQty: { gt: 0 }, expiryDate: { gt: new Date() } },
    orderBy: { expiryDate: "asc" },
  });

  const plan: { batchId: string; batchNo: string; qty: number }[] = [];
  let remaining = quantity;

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.stockQty, remaining);
    plan.push({ batchId: batch.id, batchNo: batch.batchNo, qty: take });
    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error(
      `Insufficient stock for ${brandName}: need ${quantity}, only ${quantity - remaining} available across all batches`
    );
  }

  return plan;
}

/** Generates a scannable barcode string: BRANCH-BATCHNO-timestamp (Code128-safe alphanumeric). */
export function generateBatchBarcode(branchCode: string, batchNo: string): string {
  const stamp = Date.now().toString().slice(-6);
  return `${branchCode}${batchNo}${stamp}`.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export async function getLowStockAlerts(branchId: string) {
  const batches = await prisma.medicineBatch.findMany({
    where: { branchId },
  });
  return batches.filter((b) => b.stockQty <= b.minStockQty);
}

export async function getExpiryAlerts(branchId: string, withinDays = 60) {
  return prisma.medicineBatch.findMany({
    where: {
      branchId,
      expiryDate: { lte: addDays(new Date(), withinDays), gte: new Date() },
      stockQty: { gt: 0 },
    },
    orderBy: { expiryDate: "asc" },
  });
}

export async function getExpiredBatches(branchId: string) {
  return prisma.medicineBatch.findMany({
    where: { branchId, expiryDate: { lt: new Date() }, stockQty: { gt: 0 } },
    orderBy: { expiryDate: "asc" },
  });
}
