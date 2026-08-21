export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { listRoles } from "@/actions/role-permissions";

export default async function PermissionsIndexPage() {
  const roles = await listRoles();
  if (roles.length > 0) {
    redirect(`/dashboard/settings/permissions/${roles[0].id}`);
  }
  return <div className="p-8">No roles found.</div>;
}
