"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, branchScope } from "@/lib/permissions";
import { generateSampleBarcode, isValueAbnormal } from "@/lib/lab-utils";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/actions/notifications";

export async function listLabTests(query?: string) {
  await requirePermission("LAB", "VIEW");
  return prisma.labTest.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
  });
}

/** Orders one or more lab tests for a patient in a single call (a lab panel). */
export async function orderLabTests(patientId: string, testIds: string[], orderedByDoctorId?: string) {
  const session = await requirePermission("LAB", "CREATE");
  const branchId = session.branchId;
  if (!branchId) return { ok: false, error: "No branch assigned" };
  if (testIds.length === 0) return { ok: false, error: "Select at least one test" };

  const orders = await prisma.$transaction(
    testIds.map((testId) =>
      prisma.labOrder.create({
        data: { branchId, patientId, testId, orderedByDoctorId },
      })
    )
  );

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "LAB", metadata: { patientId, count: orders.length } },
  });

  revalidatePath("/dashboard/lab");
  return { ok: true, orders };
}

/** Marks a sample as collected and assigns it a scannable tracking barcode. */
export async function collectSample(labOrderId: string) {
  const session = await requirePermission("LAB", "EDIT");

  const order = await prisma.labOrder.findUniqueOrThrow({
    where: { id: labOrderId },
    include: { branch: { select: { code: true } } },
  });

  const barcode = generateSampleBarcode(order.branch.code);

  const updated = await prisma.labOrder.update({
    where: { id: labOrderId },
    data: { status: "SAMPLE_COLLECTED", sampleCollectedAt: new Date(), sampleBarcode: barcode },
  });

  revalidatePath("/dashboard/lab");
  return { ok: true, order: updated };
}

export async function lookupOrderByBarcode(barcode: string) {
  await requirePermission("LAB", "VIEW");
  return prisma.labOrder.findUnique({
    where: { sampleBarcode: barcode },
    include: { patient: { select: { name: true, uhid: true } }, test: true },
  });
}

export interface EnterResultInput {
  labOrderId: string;
  value: string;
  remarks?: string;
}

/** Enters a result, auto-flagging it abnormal against the test's normal range. */
export async function enterResult(input: EnterResultInput) {
  const session = await requirePermission("LAB", "CREATE");

  const order = await prisma.labOrder.findUniqueOrThrow({
    where: { id: input.labOrderId },
    include: { test: true },
  });

  const isAbnormal = isValueAbnormal(input.value, order.test.normalRange);

  const result = await prisma.labResult.create({
    data: {
      labOrderId: input.labOrderId,
      value: input.value,
      unit: order.test.unit ?? undefined,
      normalRangeAtRun: order.test.normalRange ?? undefined,
      isAbnormal,
      remarks: input.remarks,
    },
  });

  await prisma.labOrder.update({ where: { id: input.labOrderId }, data: { status: "COMPLETED" } });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "LAB", metadata: { labOrderId: input.labOrderId, isAbnormal } },
  });

  revalidatePath("/dashboard/lab");
  return { ok: true, result, isAbnormal };
}

/** Marks a report as officially released (visible to patient portal / referring doctor). */
export async function releaseReport(labOrderId: string) {
  const session = await requirePermission("LAB", "APPROVE");

  const order = await prisma.labOrder.findUniqueOrThrow({
    where: { id: labOrderId },
    include: { result: true, test: true, patient: { select: { name: true } }, orderedByDoctor: { select: { userId: true } } },
  });
  if (!order.result) return { ok: false, error: "No result entered yet" };

  await prisma.labResult.update({
    where: { id: order.result.id },
    data: { releasedByUserId: session.userId, releasedAt: new Date() },
  });

  if (order.orderedByDoctor) {
    await notifyUser(
      order.orderedByDoctor.userId,
      "LAB_RESULT",
      "Lab report released",
      `${order.test.name} result for ${order.patient.name} is ready.`,
      `/dashboard/lab`
    );
  }

  revalidatePath("/dashboard/lab");
  return { ok: true };
}

/** Lab technician worklist: pending, collected, and in-progress orders for the branch. */
export async function getLabWorklist() {
  const session = await requirePermission("LAB", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  const orders = await prisma.labOrder.findMany({
    where: { ...scope, status: { in: ["ORDERED", "SAMPLE_COLLECTED", "IN_PROGRESS"] } },
    include: {
      patient: { select: { name: true, uhid: true } },
      test: true,
      orderedByDoctor: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return orders;
}

export async function getPatientLabHistory(patientId: string) {
  await requirePermission("LAB", "VIEW");

  return prisma.labOrder.findMany({
    where: { patientId, status: "COMPLETED" },
    include: { test: true, result: true },
    orderBy: { createdAt: "desc" },
  });
}
