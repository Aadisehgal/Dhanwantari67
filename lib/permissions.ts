import "server-only";
import { ActionName, ModuleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export class PermissionError extends Error {
  constructor(module: ModuleName, action: ActionName) {
    super(`Permission denied: ${action} on ${module}`);
    this.name = "PermissionError";
  }
}

export class AuthError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Central guard: call this at the top of every Server Action and API route
 * that reads or mutates data. Throws if the current session's role does not
 * have the (module, action) permission in the data-driven permission matrix.
 *
 * Usage:
 *   const session = await requirePermission("PATIENTS", "CREATE");
 */
export async function requirePermission(module: ModuleName, action: ActionName) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AuthError();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      branchId: true,
      isActive: true,
      role: {
        select: {
          name: true,
          rolePermissions: {
            where: { permission: { module, action } },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new AuthError("Account inactive or not found");
  }

  // SUPER_ADMIN bypasses the matrix (full access by design).
  if (user.role.name !== "SUPER_ADMIN" && user.role.rolePermissions.length === 0) {
    throw new PermissionError(module, action);
  }

  return {
    userId: user.id,
    branchId: user.branchId,
    role: user.role.name,
  };
}

/**
 * Row-level scoping helper: returns a Prisma `where` fragment that restricts
 * queries to the caller's branch, unless they are SUPER_ADMIN / HOSPITAL_ADMIN
 * (who see across branches).
 */
export function branchScope(role: string, branchId: string | null) {
  if (role === "SUPER_ADMIN" || role === "HOSPITAL_ADMIN") return {};
  if (!branchId) return { id: "__none__" }; // no branch => no rows
  return { branchId };
}
