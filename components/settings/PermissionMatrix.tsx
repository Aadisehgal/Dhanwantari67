"use client";

import { useState, useTransition } from "react";
import { setRolePermission, ALL_MODULES, ALL_ACTIONS } from "@/actions/role-permissions";
import type { ModuleName, ActionName } from "@prisma/client";

type MatrixRow = { module: ModuleName; actions: { action: ActionName; granted: boolean }[] };

export function PermissionMatrix({ roleId, initialMatrix }: { roleId: string; initialMatrix: MatrixRow[] }) {
  const [matrix, setMatrix] = useState(initialMatrix);
  const [pending, startTransition] = useTransition();

  function toggle(module: ModuleName, action: ActionName, current: boolean) {
    setMatrix((prev) =>
      prev.map((row) =>
        row.module !== module
          ? row
          : {
              ...row,
              actions: row.actions.map((a) => (a.action === action ? { ...a, granted: !current } : a)),
            }
      )
    );
    startTransition(async () => {
      await setRolePermission(roleId, module, action, !current);
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-neutral-50 dark:bg-neutral-900">
            <th className="p-3 text-left">Module</th>
            {ALL_ACTIONS.map((a) => (
              <th key={a} className="p-3 text-center">
                {a}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={row.module} className="border-t border-neutral-100 dark:border-neutral-800">
              <td className="p-3 font-medium">{row.module}</td>
              {row.actions.map(({ action, granted }) => (
                <td key={action} className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={granted}
                    disabled={pending}
                    onChange={() => toggle(row.module, action, granted)}
                    className="h-4 w-4 accent-brand-600"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
