"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { checkAllergyConflict } from "@/lib/medical-data/medicines";
import { revalidatePath } from "next/cache";

export interface VitalsInput {
  patientId: string;
  bp?: string;
  pulse?: number;
  temperature?: number;
  spo2?: number;
  weightKg?: number;
  heightCm?: number;
}

function calcBMI(weightKg?: number, heightCm?: number): number | undefined {
  if (!weightKg || !heightCm) return undefined;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export async function recordVitals(input: VitalsInput) {
  await requirePermission("OPD", "CREATE");

  const bmi = calcBMI(input.weightKg, input.heightCm);

  const vitals = await prisma.vitals.create({
    data: {
      patientId: input.patientId,
      bp: input.bp,
      pulse: input.pulse,
      temperature: input.temperature,
      spo2: input.spo2,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      bmi,
    },
  });

  revalidatePath(`/dashboard/opd/${input.patientId}`);
  return { ok: true, vitals };
}

export async function createEMREntry(patientId: string, visitType: "OPD" | "IPD", notes?: string) {
  await requirePermission("EMR", "CREATE");

  const emr = await prisma.eMR.create({
    data: { patientId, visitType, notes },
  });

  revalidatePath(`/dashboard/opd/${patientId}`);
  return { ok: true, emr };
}

export async function addDiagnosis(emrId: string, icd10Code: string, label: string) {
  await requirePermission("EMR", "CREATE");

  const diagnosis = await prisma.diagnosis.create({
    data: { emrId, icd10Code, label },
  });

  return { ok: true, diagnosis };
}

export interface PrescriptionItemInput {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface PrescriptionWarning {
  type: "ALLERGY" | "INTERACTION";
  message: string;
  drugs: string[];
}

/**
 * Creates a prescription after running rule-based safety checks:
 * 1. Each drug is checked against the patient's recorded allergy list.
 * 2. Every pair of drugs in the prescription is checked against the
 *    DrugInteraction table.
 * Warnings are returned alongside the created prescription so the UI can
 * show them to the doctor (does not block creation — doctor's clinical
 * judgement takes precedence, per standard EMR practice).
 */
export async function createPrescription(
  emrId: string,
  doctorId: string,
  patientId: string,
  items: PrescriptionItemInput[]
) {
  const session = await requirePermission("OPD", "CREATE");

  const patient = await prisma.patient.findUniqueOrThrow({
    where: { id: patientId },
    select: { allergies: true },
  });

  const warnings: PrescriptionWarning[] = [];

  for (const item of items) {
    const allergyMsg = checkAllergyConflict(item.medicineName, patient.allergies);
    if (allergyMsg) {
      warnings.push({ type: "ALLERGY", message: allergyMsg, drugs: [item.medicineName] });
    }
  }

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]!.medicineName;
      const b = items[j]!.medicineName;
      const interaction = await prisma.drugInteraction.findFirst({
        where: {
          OR: [
            { drugA: a, drugB: b },
            { drugA: b, drugB: a },
          ],
        },
      });
      if (interaction) {
        warnings.push({
          type: "INTERACTION",
          message: `${interaction.severity} interaction: ${interaction.note ?? "check clinical reference"}`,
          drugs: [a, b],
        });
      }
    }
  }

  const prescription = await prisma.prescription.create({
    data: {
      emrId,
      doctorId,
      items: { create: items },
    },
    include: { items: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "CREATE",
      module: "OPD",
      metadata: { prescriptionId: prescription.id, warningCount: warnings.length },
    },
  });

  revalidatePath(`/dashboard/opd/${patientId}`);
  return { ok: true, prescription, warnings };
}

export async function getEMRTimeline(patientId: string) {
  await requirePermission("EMR", "VIEW");

  return prisma.eMR.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      diagnoses: true,
      prescriptions: { include: { items: true, doctor: { include: { user: { select: { name: true } } } } } },
    },
  });
}
