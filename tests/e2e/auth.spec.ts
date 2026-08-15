import { test, expect } from "@playwright/test";
import { loginAs, DEMO_ACCOUNTS } from "./utils/auth";

test.describe("Authentication", () => {
  test("redirects unauthenticated users from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("logs in successfully with valid demo credentials", async ({ page }) => {
    await loginAs(page, "admin");
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="text"]').fill(DEMO_ACCOUNTS.admin.email);
    await page.locator('input[type="password"]').fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email\/phone or password/i)).toBeVisible();
  });

  test("role-specific dashboard stat widgets render after login", async ({ page }) => {
    await loginAs(page, "admin");
    await expect(page.getByText(/revenue today/i)).toBeVisible();
  });
});
