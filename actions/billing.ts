"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, branchScope } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { InvoiceItemCategory, PaymentMode } from "@prisma/client";

export async function generateInvoiceNo(branchId: string): Promise<string> {
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: branchId }, select: { code: true } });
  const year = new Date().getFullYear();
  const prefix = `INV-${branch.code}-${year}-`;
  const count = await prisma.invoice.count({ where: { branchId, invoiceNo: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(6, "0")}`;
}

export interface InvoiceLineInput {
  category: InvoiceItemCategory;
  description: string;
  quantity: number;
  unitPrice: number;
  gstPercent: number;
}

/**
 * Creates a fully itemized invoice (consultation + pharmacy + lab + procedure
 * lines all in one bill, per Section 4.11's consolidated-billing requirement).
 * GST is computed per line and summed; matches the printed invoice PDF.
 */
export async function createInvoice(patientId: string, lines: InvoiceLineInput[]) {
  const session = await requirePermission("BILLING", "CREATE");
  const branchId = session.branchId;
  if (!branchId) return { ok: false, error: "No branch assigned" };
  if (lines.length === 0) return { ok: false, error: "Invoice must have at least one line item" };

  const invoiceNo = await generateInvoiceNo(branchId);

  let subtotal = 0;
  let gstAmount = 0;
  const itemsData = lines.map((l) => {
    const lineBase = l.quantity * l.unitPrice;
    const lineGst = (lineBase * l.gstPercent) / 100;
    subtotal += lineBase;
    gstAmount += lineGst;
    return {
      category: l.category,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      gstPercent: l.gstPercent,
      amount: lineBase + lineGst,
    };
  });

  const totalAmount = subtotal + gstAmount;

  const invoice = await prisma.invoice.create({
    data: {
      branchId,
      patientId,
      invoiceNo,
      subtotal,
      gstAmount,
      totalAmount,
      status: "PENDING",
      items: { create: itemsData },
    },
    include: { items: true },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "BILLING", metadata: { invoiceId: invoice.id, totalAmount } },
  });

  revalidatePath("/dashboard/billing");
  return { ok: true, invoice };
}

export async function recordPayment(invoiceId: string, amount: number, mode: PaymentMode, referenceNo?: string) {
  const session = await requirePermission("BILLING", "EDIT");

  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });

  await prisma.payment.create({
    data: { invoiceId, amount, mode, referenceNo },
  });

  const newAmountPaid = Number(invoice.amountPaid) + amount;
  const newStatus =
    newAmountPaid >= Number(invoice.totalAmount)
      ? "PAID"
      : newAmountPaid > 0
        ? "PARTIALLY_PAID"
        : "PENDING";

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { amountPaid: newAmountPaid, status: newStatus },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "BILLING", metadata: { invoiceId, amount, mode } },
  });

  revalidatePath(`/dashboard/billing/${invoiceId}`);
  return { ok: true, invoice: updated };
}

export async function issueCreditNote(invoiceId: string, amount: number, reason: string) {
  const session = await requirePermission("BILLING", "APPROVE");

  const note = await prisma.creditNote.create({ data: { invoiceId, amount, reason } });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "APPROVE", module: "BILLING", metadata: { invoiceId, amount, reason } },
  });

  revalidatePath(`/dashboard/billing/${invoiceId}`);
  return { ok: true, note };
}

export async function issueRefund(invoiceId: string, amount: number, mode: PaymentMode, reason?: string) {
  const session = await requirePermission("BILLING", "APPROVE");

  const refund = await prisma.refund.create({ data: { invoiceId, amount, mode, reason } });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "REFUNDED" },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "APPROVE", module: "BILLING", metadata: { invoiceId, amount, refundId: refund.id } },
  });

  revalidatePath(`/dashboard/billing/${invoiceId}`);
  return { ok: true, refund };
}

export async function getInvoiceById(invoiceId: string) {
  const session = await requirePermission("BILLING", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  return prisma.invoice.findFirst({
    where: { id: invoiceId, ...scope },
    include: {
      items: true,
      payments: true,
      creditNotes: true,
      patient: { select: { name: true, uhid: true, phone: true } },
      branch: { include: { hospital: true } },
    },
  });
}

export async function listInvoices(query?: string) {
  const session = await requirePermission("BILLING", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  return prisma.invoice.findMany({
    where: {
      ...scope,
      ...(query
        ? { OR: [{ invoiceNo: { contains: query, mode: "insensitive" } }, { patient: { name: { contains: query, mode: "insensitive" } } }] }
        : {}),
    },
    include: { patient: { select: { name: true, uhid: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
