"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, branchScope } from "@/lib/permissions";
import { generateUHID, findDuplicatePatients } from "@/lib/patient-utils";
import { patientSchema, type PatientFormValues } from "@/lib/validators/patient";
import { revalidatePath } from "next/cache";

export interface CreatePatientResult {
  ok: boolean;
  patientId?: string;
  uhid?: string;
  duplicates?: Awaited<ReturnType<typeof findDuplicatePatients>>;
  error?: string;
}

/**
 * Creates a new patient after checking for likely duplicates. If duplicates
 * are found and `forceCreate` was not set, returns them for the UI to show
 * a confirmation dialog instead of silently creating a second record.
 */
export async function createPatient(input: PatientFormValues): Promise<CreatePatientResult> {
  const session = await requirePermission("PATIENTS", "CREATE");
  const parsed = patientSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const branchId = session.branchId;
  if (!branchId) return { ok: false, error: "User has no assigned branch" };

  const dobDate = data.dob ? new Date(data.dob) : null;

  if (!data.forceCreate) {
    const duplicates = await findDuplicatePatients({
      branchId,
      name: data.name,
      phone: data.phone,
      dob: dobDate,
    });

    if (duplicates.length > 0) {
      return { ok: false, duplicates };
    }
  }

  const uhid = await generateUHID(branchId);

  const patient = await prisma.patient.create({
    data: {
      branchId,
      uhid,
      name: data.name,
      dob: dobDate,
      gender: data.gender ?? undefined,
      phone: data.phone,
      email: data.email || undefined,
      bloodGroup: data.bloodGroup ?? undefined,
      allergies: data.allergies ?? [],
      govtIdNumber: data.govtIdNumber ?? undefined,
      address: data.address ?? undefined,
      emergencyName: data.emergencyName ?? undefined,
      emergencyPhone: data.emergencyPhone ?? undefined,
      familyId: data.familyId ?? undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "CREATE",
      module: "PATIENTS",
      metadata: { patientId: patient.id, uhid: patient.uhid },
    },
  });

  revalidatePath("/dashboard/patients");

  return { ok: true, patientId: patient.id, uhid: patient.uhid };
}

export async function searchPatients(query: string) {
  const session = await requirePermission("PATIENTS", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  if (!query.trim()) {
    return prisma.patient.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  return prisma.patient.findMany({
    where: {
      ...scope,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { uhid: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPatientById(patientId: string) {
  const session = await requirePermission("PATIENTS", "VIEW");
  const scope = branchScope(session.role, session.branchId);

  return prisma.patient.findFirst({
    where: { id: patientId, ...scope },
    include: {
      family: { include: { members: true } },
      vitals: { orderBy: { recordedAt: "desc" }, take: 10 },
      appointments: { orderBy: { scheduledAt: "desc" }, take: 10, include: { doctor: { include: { user: true } } } },
    },
  });
}

/** Links a patient into an existing family group, or creates a new one. */
export async function linkFamilyMember(patientId: string, familyCode: string) {
  await requirePermission("PATIENTS", "EDIT");

  const family = await prisma.patientFamily.upsert({
    where: { familyId: familyCode },
    update: {},
    create: { familyId: familyCode },
  });

  await prisma.patient.update({
    where: { id: patientId },
    data: { familyId: family.id },
  });

  revalidatePath("/dashboard/patients");
  return { ok: true };
}
