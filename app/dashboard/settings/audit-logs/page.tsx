export const dynamic = "force-dynamic";

import { getAuditLogs } from "@/actions/audit";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; days?: string }>;
}) {
  const { module, days } = await searchParams;

  let logs;
  try {
    logs = await getAuditLogs({ module, days: days ? Number(days) : 30 });
  } catch {
    return (
      <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-800">
          Only admin roles can view the audit log.
        </p>
      </div>
    );
  }

  const modules = ["PATIENTS", "APPOINTMENTS", "QUEUE", "OPD", "IPD", "OT", "EMR", "LAB", "PHARMACY", "BILLING", "HR"];

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Audit Log</h1>

      <form className="mb-6 flex gap-3">
        <select name="module" defaultValue={module ?? ""} className="input max-w-xs">
          <option value="">All Modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select name="days" defaultValue={days ?? "30"} className="input max-w-xs">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left dark:bg-neutral-800">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">User</th>
              <th className="p-3">Action</th>
              <th className="p-3">Module</th>
              <th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="p-3 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-3">{log.user?.name ?? "System"}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.module}</td>
                <td className="p-3 font-mono text-xs text-neutral-500">{JSON.stringify(log.metadata)}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-neutral-400">No audit entries for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
