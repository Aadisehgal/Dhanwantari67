import { Page, expect } from "@playwright/test";

export const DEMO_ACCOUNTS = {
  admin: { email: "admin@dhanwantari.demo", password: "Demo@1234" },
  reception: { email: "reception@dhanwantari.demo", password: "Demo@1234" },
  doctor: { email: "doctor@dhanwantari.demo", password: "Demo@1234" },
  pharmacist: { email: "pharmacist@dhanwantari.demo", password: "Demo@1234" },
  accountant: { email: "accountant@dhanwantari.demo", password: "Demo@1234" },
};

export async function loginAs(page: Page, account: keyof typeof DEMO_ACCOUNTS) {
  const { email, password } = DEMO_ACCOUNTS[account];
  await page.goto("/login");
  await page.locator('input[type="text"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
