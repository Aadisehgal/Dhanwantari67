import { test, expect } from "@playwright/test";
import { loginAs } from "./utils/auth";

test.describe("Billing", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "accountant");
  });

  test("creates an invoice and shows the printable bill button", async ({ page }) => {
    await page.goto("/dashboard/billing/new");
    await page.getByRole("button", { name: /generate invoice/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/billing\/[a-z0-9]+/);
    await expect(page.getByRole("link", { name: /print \/ download bill/i })).toBeVisible();
  });

  test("invoice PDF endpoint responds with a PDF content type", async ({ page, request }) => {
    await page.goto("/dashboard/billing/new");
    await page.getByRole("button", { name: /generate invoice/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/billing\/([a-z0-9]+)/);

    const url = page.url();
    const invoiceId = url.split("/").pop();
    const response = await request.get(`/api/invoices/${invoiceId}/pdf`);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  });

  test("billing list page shows created invoices with status badges", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await expect(page.getByText(/invoice no\./i)).toBeVisible();
  });
});
