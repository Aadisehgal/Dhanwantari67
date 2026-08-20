"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { ModuleName, ActionName } from "@prisma/client";
import { ALL_MODULES, ALL_ACTIONS } from "@/lib/permission-constants";

/** Lists every role (standard + custom) so the admin can pick one to edit. */
export async function listRoles() {
  await requirePermission("SETTINGS", "VIEW");
  return prisma.role.findMany({ orderBy: [{ isCustom: "asc" }, { label: "asc" }] });
}

/** Returns a module x action grant matrix for a single role, for rendering as a checkbox grid. */
export async function getRolePermissionMatrix(roleId: string) {
  await requirePermission("SETTINGS", "VIEW");

  const granted = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });
  const grantedSet = new Set(granted.map((g) => `${g.permission.module}:${g.permission.action}`));

  return ALL_MODULES.map((module) => ({
    module,
    actions: ALL_ACTIONS.map((action) => ({
      action,
      granted: grantedSet.has(`${module}:${action}`),
    })),
  }));
}

/** Grants or revokes one (module, action) permission for a role. */
export async function setRolePermission(
  roleId: string,
  module: ModuleName,
  action: ActionName,
  granted: boolean
) {
  const session = await requirePermission("SETTINGS", "EDIT");

  const permission = await prisma.permission.upsert({
    where: { module_action: { module, action } },
    update: {},
    create: { module, action },
  });

  if (granted) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId: permission.id } },
      update: {},
      create: { roleId, permissionId: permission.id },
    });
  } else {
    await prisma.rolePermission.deleteMany({ where: { roleId, permissionId: permission.id } });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "EDIT",
      module: "SETTINGS",
      metadata: { roleId, permissionModule: module, permissionAction: action, granted },
    },
  });

  revalidatePath("/dashboard/settings/permissions");
  return { ok: true };
}
