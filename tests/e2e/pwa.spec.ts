import { test, expect } from "@playwright/test";

test.describe("PWA", () => {
  test("manifest.json is reachable and well-formed", async ({ request }) => {
    const response = await request.get("/manifest.json");
    expect(response.ok()).toBeTruthy();
    const manifest = await response.json();
    expect(manifest.name).toBe("Dhanwantari Healthcare");
    expect(manifest.display).toBe("standalone");
  });

  test("login page references the manifest for installability", async ({ page }) => {
    await page.goto("/login");
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.json");
  });
});
