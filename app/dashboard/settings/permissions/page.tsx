export const dynamic = "force-dynamic";

import Link from "next/link";
import { listRoles, getRolePermissionMatrix } from "@/actions/role-permissions";
import { PermissionMatrix } from "@/components/settings/PermissionMatrix";

export default async function PermissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ roleId?: string }>;
}) {
  const { roleId } = await searchParams;

  let roles;
  try {
    roles = await listRoles();
  } catch {
    return (
      <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-800">
          Only admin roles can manage permissions.
        </p>
      </div>
    );
  }

  const selectedRoleId = roleId ?? roles[0]?.id;
  const matrix = selectedRoleId ? await getRolePermissionMatrix(selectedRoleId) : [];
  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-1 text-2xl font-bold text-brand-700">Staff Access & Permissions</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Choose a role, then tick which modules and actions that role is allowed to use. Changes apply
        immediately to everyone with that role.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {roles.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/settings/permissions?roleId=${r.id}`}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              r.id === selectedRoleId
                ? "bg-brand-600 text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-900"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      {selectedRole && (
        <>
          <h2 className="mb-3 font-semibold">{selectedRole.label}</h2>
          <PermissionMatrix roleId={selectedRole.id} initialMatrix={matrix} />
        </>
      )}
    </div>
  );
}
