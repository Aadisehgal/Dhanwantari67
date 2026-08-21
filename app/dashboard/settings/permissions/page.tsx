export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { listRoles } from "@/actions/role-permissions";

export default async function PermissionsIndexPage() {
  const roles = await listRoles();
  const firstRole = roles[0];
  if (firstRole) {
    redirect(`/dashboard/settings/permissions/${firstRole.id}`);
  }
  return <div className="p-8">No roles found.</div>;
}
