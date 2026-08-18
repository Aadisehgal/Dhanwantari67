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

  try {
    const patient = await prisma.patient.create({
      data: {
        branchId,
        uhid,
        name: data.name,
        dob: dobDate,
        gender: data.gender || undefined,
        phone: data.phone,
        email: data.email?.trim() || undefined,
        bloodGroup: data.bloodGroup?.trim() || undefined,
        allergies: data.allergies ?? [],
        govtIdNumber: data.govtIdNumber?.trim() || undefined,
        address: data.address ?? undefined,
        emergencyName: data.emergencyName?.trim() || undefined,
        emergencyPhone: data.emergencyPhone?.trim() || undefined,
        familyId: data.familyId?.trim() ? data.familyId.trim() : undefined,
      },
    });

    // If any initial vitals were entered on the registration form, save them as the first vitals record.
    const hasVitals =
      data.vitalsBp || data.vitalsPulse || data.vitalsTemperature || data.vitalsBloodSugar;
    if (hasVitals) {
      await prisma.vitals.create({
        data: {
          patientId: patient.id,
          bp: data.vitalsBp || undefined,
          pulse: data.vitalsPulse ? parseInt(data.vitalsPulse, 10) : undefined,
          temperature: data.vitalsTemperature ? parseFloat(data.vitalsTemperature) : undefined,
          bloodSugar: data.vitalsBloodSugar ? parseFloat(data.vitalsBloodSugar) : undefined,
        },
      });
    }

    // If medical history was entered, split on commas into individual chronic condition records.
    if (data.medicalHistory?.trim()) {
      const conditions = data.medicalHistory
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      if (conditions.length > 0) {
        await prisma.chronicCondition.createMany({
          data: conditions.map((condition) => ({ patientId: patient.id, condition })),
        });
      }
    }

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
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save patient. Please try again.",
    };
  }
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
      chronicConditions: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
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

/** Uploads a photo/scan of a report and attaches it to a patient's record. */
export async function uploadPatientDocument(formData: FormData) {
  const session = await requirePermission("PATIENTS", "EDIT");

  const patientId = formData.get("patientId") as string;
  const category = (formData.get("category") as string) || "Other";
  const file = formData.get("file") as File | null;

  if (!patientId || !file || file.size === 0) {
    return { ok: false, error: "Missing patient or file" };
  }

  const { put } = await import("@vercel/blob");
  const blob = await put(`patient-documents/${patientId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  await prisma.patientDocument.create({
    data: {
      patientId,
      url: blob.url,
      fileName: file.name,
      fileType: file.type,
      category,
      uploadedBy: session.userId,
    },
  });

  revalidatePath(`/dashboard/patients/${patientId}`);
  return { ok: true, url: blob.url };
}

/** Returns all uploaded documents (report photos/scans) for a patient, most recent first. */
export async function getPatientDocuments(patientId: string) {
  await requirePermission("PATIENTS", "VIEW");
  return prisma.patientDocument.findMany({
    where: { patientId },
    orderBy: { uploadedAt: "desc" },
  });
}

/** Deletes a single uploaded document record (does not remove the underlying blob). */
export async function deletePatientDocument(formData: FormData) {
  await requirePermission("PATIENTS", "EDIT");
  const documentId = formData.get("documentId") as string;
  const patientId = formData.get("patientId") as string;
  await prisma.patientDocument.delete({ where: { id: documentId } });
  revalidatePath(`/dashboard/patients/${patientId}`);
}
