import { test, expect } from "@playwright/test";
import { loginAs } from "./utils/auth";

test.describe("Appointments & Queue", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "reception");
  });

  test("books a same-day appointment for an existing patient", async ({ page }) => {
    await page.goto("/dashboard/appointments");
    await page.getByText(/\+ book new appointment/i).click();

    const dateTimeLocal = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
    await page.locator('input[name="scheduledAt"]').fill(dateTimeLocal);
    await page.locator('input[name="reason"]').fill("E2E automated booking");
    await page.getByRole("button", { name: /^book appointment$/i }).click();

    await expect(page.getByText(/E2E automated booking/i)).toBeVisible();
  });

  test("supports booking a recurring series (e.g. physiotherapy)", async ({ page }) => {
    await page.goto("/dashboard/appointments");
    await page.getByText(/\+ book new appointment/i).click();

    await page.getByLabel(/recurring/i).check();
    const dateTimeLocal = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
    await page.locator('input[name="scheduledAt"]').fill(dateTimeLocal);
    await page.locator('input[name="count"]').fill("3");
    await page.getByRole("button", { name: /^book appointment$/i }).click();

    await expect(page.getByText(/no appointments in this range/i)).not.toBeVisible();
  });
});
