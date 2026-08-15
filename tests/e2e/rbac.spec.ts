import { test, expect } from "@playwright/test";
import { loginAs } from "./utils/auth";

test.describe("Role-Based Access Control", () => {
  test("pharmacist sees a friendly access-denied message on Reports, not a crash", async ({ page }) => {
    await loginAs(page, "pharmacist");
    await page.goto("/dashboard/reports");
    await expect(page.getByText(/don't have access to reports/i)).toBeVisible();
  });

  test("pharmacist dashboard shows only the low-stock widget, not admin-wide stats", async ({ page }) => {
    await loginAs(page, "pharmacist");
    await expect(page.getByText(/low stock items/i)).toBeVisible();
    await expect(page.getByText(/revenue today/i)).not.toBeVisible();
  });

  test("non-admin role cannot view the audit log", async ({ page }) => {
    await loginAs(page, "reception");
    await page.goto("/dashboard/settings/audit-logs");
    await expect(page.getByText(/only admin roles can view the audit log/i)).toBeVisible();
  });
});
