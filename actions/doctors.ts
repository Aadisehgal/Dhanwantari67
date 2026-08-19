"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function listDoctors() {
  await requirePermission("HR", "VIEW");
  return prisma.doctor.findMany({
    include: { user: { include: { role: true } } },
    orderBy: { user: { name: "asc" } },
  });
}

/** Lightweight role list for the "assign access level" dropdown when adding/editing a doctor. */
export async function listAssignableRoles() {
  await requirePermission("HR", "VIEW");
  return prisma.role.findMany({
    orderBy: [{ isCustom: "asc" }, { label: "asc" }],
    select: { id: true, label: true, name: true },
  });
}

export async function getDoctorById(doctorId: string) {
  await requirePermission("HR", "VIEW");
  return prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { user: { include: { role: true } } },
  });
}

/** Creates a new login + Doctor profile. roleId lets the admin pick any role (including a custom one) to control access. */
export async function createDoctor(data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  roleId: string;
  branchId?: string | null;
  specialization?: string;
  qualification?: string;
  avgConsultMins?: number;
}) {
  const session = await requirePermission("HR", "CREATE");

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { ok: false, error: "A user with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      passwordHash,
      roleId: data.roleId,
      branchId: data.branchId ?? session.branchId ?? undefined,
    },
  });

  const doctor = await prisma.doctor.create({
    data: {
      userId: user.id,
      specialization: data.specialization || undefined,
      qualification: data.qualification || undefined,
      avgConsultMins: data.avgConsultMins ?? 15,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "CREATE",
      module: "HR",
      metadata: { doctorId: doctor.id, name: data.name },
    },
  });

  revalidatePath("/dashboard/hr/doctors");
  return { ok: true, doctorId: doctor.id };
}

/** Updates a doctor's name, contact info, specialization, and role (access level). */
export async function updateDoctor(
  doctorId: string,
  data: {
    name?: string;
    phone?: string;
    specialization?: string;
    qualification?: string;
    avgConsultMins?: number;
    roleId?: string;
    isActive?: boolean;
  }
) {
  const session = await requirePermission("HR", "EDIT");

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) return { ok: false, error: "Doctor not found" };

  await prisma.user.update({
    where: { id: doctor.userId },
    data: {
      name: data.name || undefined,
      phone: data.phone || undefined,
      roleId: data.roleId || undefined,
      isActive: data.isActive ?? undefined,
    },
  });

  await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      specialization: data.specialization || undefined,
      qualification: data.qualification || undefined,
      avgConsultMins: data.avgConsultMins ?? undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "EDIT",
      module: "HR",
      metadata: { doctorId },
    },
  });

  revalidatePath("/dashboard/hr/doctors");
  revalidatePath(`/dashboard/hr/doctors/${doctorId}`);
  return { ok: true };
}
