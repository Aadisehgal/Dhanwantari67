import { test, expect } from "@playwright/test";
import { loginAs } from "./utils/auth";

test.describe("Patient Registration", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "reception");
  });

  test("registers a new patient and generates a UHID", async ({ page }) => {
    await page.goto("/dashboard/patients/new");

    const uniquePhone = `9${Date.now().toString().slice(-9)}`;
    await page.getByPlaceholder("Ramesh Kumar").fill("E2E Test Patient");
    await page.getByPlaceholder("9876543210").fill(uniquePhone);
    await page.getByRole("button", { name: /register patient/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/patients\/[a-z0-9]+/);
    await expect(page.getByText(/E2E Test Patient/i)).toBeVisible();
  });

  test("flags a likely duplicate when the same phone number is reused", async ({ page }) => {
    const phone = `8${Date.now().toString().slice(-9)}`;

    await page.goto("/dashboard/patients/new");
    await page.getByPlaceholder("Ramesh Kumar").fill("Duplicate Check Patient");
    await page.getByPlaceholder("9876543210").fill(phone);
    await page.getByRole("button", { name: /register patient/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/patients\/[a-z0-9]+/);

    await page.goto("/dashboard/patients/new");
    await page.getByPlaceholder("Ramesh Kumar").fill("Duplicate Check Patient");
    await page.getByPlaceholder("9876543210").fill(phone);
    await page.getByRole("button", { name: /register patient/i }).click();

    await expect(page.getByText(/possible existing patient records found/i)).toBeVisible();
  });

  test("can search for a registered patient by UHID or phone", async ({ page }) => {
    await page.goto("/dashboard/patients");
    await page.locator('input[name="q"]').fill("Duplicate Check Patient");
    await page.keyboard.press("Enter");
    await expect(page.getByText(/Duplicate Check Patient/i)).toBeVisible();
  });
});
