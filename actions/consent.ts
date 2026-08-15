"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { ConsentFormType } from "@prisma/client";

export interface ConsentFormInput {
  patientId: string;
  admissionId?: string;
  formType: ConsentFormType;
  content: string;
  signerName: string;
  signerRelation: string;
  signatureDataUrl: string; // base64 PNG captured from the signature-pad canvas
  witnessName?: string;
}

export async function createConsentForm(input: ConsentFormInput) {
  const session = await requirePermission("IPD", "CREATE");

  const form = await prisma.consentForm.create({
    data: {
      patientId: input.patientId,
      admissionId: input.admissionId,
      formType: input.formType,
      content: input.content,
      signerName: input.signerName,
      signerRelation: input.signerRelation,
      signatureDataUrl: input.signatureDataUrl,
      witnessName: input.witnessName,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "CREATE", module: "IPD", metadata: { consentFormId: form.id, formType: input.formType } },
  });

  revalidatePath("/dashboard/ipd");
  return { ok: true, form };
}

export async function listConsentForms(patientId: string) {
  await requirePermission("IPD", "VIEW");
  return prisma.consentForm.findMany({ where: { patientId }, orderBy: { signedAt: "desc" } });
}

export async function getConsentForm(id: string) {
  await requirePermission("IPD", "VIEW");
  return prisma.consentForm.findUnique({
    where: { id },
    include: { patient: { include: { branch: { include: { hospital: true } } } } },
  });
}

