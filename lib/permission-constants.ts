import type { ModuleName, ActionName } from "@prisma/client";

export const ALL_MODULES: ModuleName[] = [
  "DASHBOARD",
  "PATIENTS",
  "APPOINTMENTS",
  "QUEUE",
  "OPD",
  "IPD",
  "OT",
  "EMR",
  "LAB",
  "PHARMACY",
  "BILLING",
  "HR",
  "REPORTS",
  "SETTINGS",
  "NOTIFICATIONS",
];

export const ALL_ACTIONS: ActionName[] = ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"];
