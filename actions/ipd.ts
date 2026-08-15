"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { generateInvoiceNo } from "@/actions/billing";
import { revalidatePath } from "next/cache";
import { differenceInCalendarDays } from "date-fns";

/** Admits a patient into a specific bed (must be VACANT), marking it OCCUPIED. */
export async function admitPatient(
  patientId: string,
  bedId: string,
  admittingDoctorId: string | undefined,
  diagnosis?: string
) {
  const session = await requirePermission("IPD", "CREATE");

  const bed = await prisma.bed.findUniqueOrThrow({ where: { id: bedId } });
  if (bed.status !== "VACANT") {
    return { ok: false, error: `Bed ${bed.label} is not vacant (currently ${bed.status})` };
  }

  const [admission] = await prisma.$transaction([
    prisma.admission.create({
      data: { patientId, bedId, admittingDoctorId, diagnosis },
    }),
    prisma.bed.update({ where: { id: bedId }, data: { status: "OCCUPIED" } }),
  ]);

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "IPD", metadata: { admissionId: admission.id, bedId } },
  });

  revalidatePath("/dashboard/ipd");
  return { ok: true, admission };
}

export async function recordNursingNote(
  admissionId: string,
  note: string,
  vitals?: { bp?: string; pulse?: number; temperature?: number; spo2?: number }
) {
  const session = await requirePermission("IPD", "CREATE");

  const entry = await prisma.nursingNote.create({
    data: { admissionId, note, recordedBy: session.userId, ...vitals },
  });

  revalidatePath(`/dashboard/ipd/${admissionId}`);
  return { ok: true, entry };
}

/** Ward/bed occupancy board: every bed, its status, and current patient if occupied. */
export async function getWardOccupancy(branchId: string) {
  await requirePermission("IPD", "VIEW");

  return prisma.ward.findMany({
    where: { branchId },
    include: {
      beds: {
        include: {
          admissions: {
            where: { status: "ADMITTED" },
            include: { patient: { select: { name: true, uhid: true } } },
            take: 1,
          },
        },
      },
    },
  });
}

export async function transferBed(admissionId: string, newBedId: string) {
  const session = await requirePermission("IPD", "EDIT");

  const admission = await prisma.admission.findUniqueOrThrow({ where: { id: admissionId } });
  const newBed = await prisma.bed.findUniqueOrThrow({ where: { id: newBedId } });
  if (newBed.status !== "VACANT") {
    return { ok: false, error: `Bed ${newBed.label} is not vacant` };
  }

  await prisma.$transaction([
    prisma.bed.update({ where: { id: admission.bedId }, data: { status: "CLEANING" } }),
    prisma.bed.update({ where: { id: newBedId }, data: { status: "OCCUPIED" } }),
    prisma.admission.update({ where: { id: admissionId }, data: { bedId: newBedId, status: "TRANSFERRED" } }),
  ]);

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "EDIT", module: "IPD", metadata: { admissionId, newBedId } },
  });

  revalidatePath("/dashboard/ipd");
  return { ok: true };
}

export interface DischargeInput {
  admissionId: string;
  finalDiagnosis: string;
  treatmentSummary: string;
  followUpInstructions?: string;
  followUpDate?: string;
  dischargedByDoctorId?: string;
}

/**
 * Discharges a patient: frees the bed (marks CLEANING, not immediately VACANT,
 * per standard infection-control housekeeping practice), creates the discharge
 * summary, and auto-generates a room-charge invoice (days stayed x bed daily rate).
 */
export async function dischargePatient(input: DischargeInput) {
  const session = await requirePermission("IPD", "EDIT");

  const admission = await prisma.admission.findUniqueOrThrow({
    where: { id: input.admissionId },
    include: { bed: { include: { ward: true } } },
  });

  if (admission.status !== "ADMITTED") {
    return { ok: false, error: "This admission has already been discharged or transferred out" };
  }

  const dischargedAt = new Date();
  const days = Math.max(1, differenceInCalendarDays(dischargedAt, admission.admittedAt) + 1);
  const dailyRate = Number(admission.bed.dailyRate);

  const [, , summary] = await prisma.$transaction([
    prisma.admission.update({
      where: { id: admission.id },
      data: { status: "DISCHARGED", dischargedAt },
    }),
    prisma.bed.update({ where: { id: admission.bedId }, data: { status: "CLEANING" } }),
    prisma.dischargeSummary.create({
      data: {
        admissionId: admission.id,
        finalDiagnosis: input.finalDiagnosis,
        treatmentSummary: input.treatmentSummary,
        followUpInstructions: input.followUpInstructions,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
        dischargedByDoctorId: input.dischargedByDoctorId,
      },
    }),
  ]);

  // Auto-generate the room-charge invoice for this stay.
  const invoiceNo = await generateInvoiceNo(admission.bed.ward.branchId);
  const lineBase = days * dailyRate;
  const invoice = await prisma.invoice.create({
    data: {
      branchId: admission.bed.ward.branchId,
      patientId: admission.patientId,
      invoiceNo,
      subtotal: lineBase,
      gstAmount: 0,
      totalAmount: lineBase,
      status: "PENDING",
      items: {
        create: [
          {
            category: "ROOM_CHARGE",
            description: `Room charges — ${admission.bed.ward.name} / Bed ${admission.bed.label} (${days} day${days > 1 ? "s" : ""})`,
            quantity: days,
            unitPrice: dailyRate,
            gstPercent: 0,
            amount: lineBase,
          },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "EDIT", module: "IPD", metadata: { admissionId: admission.id, invoiceId: invoice.id } },
  });

  revalidatePath("/dashboard/ipd");
  return { ok: true, summary, invoice, days, roomCharges: lineBase };
}

export async function getAdmissionDetail(admissionId: string) {
  await requirePermission("IPD", "VIEW");

  return prisma.admission.findUnique({
    where: { id: admissionId },
    include: {
      patient: true,
      bed: { include: { ward: true } },
      admittingDoctor: { include: { user: { select: { name: true } } } },
      nursingNotes: { orderBy: { recordedAt: "desc" } },
      dischargeSummary: true,
    },
  });
}
