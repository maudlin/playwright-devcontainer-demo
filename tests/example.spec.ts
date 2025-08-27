import { test, expect } from "@playwright/test";

test("Demo flow: Example â†’ IANA", async ({ page }) => {
  await test.step("Navigate to example.com", async () => {
    await page.goto("https://example.com");
    await expect(page).toHaveTitle(/Example Domain/);
  });

  await test.step("Open â€œMore informationâ€ link", async () => {
    await page.getByRole("link", { name: "More information" }).click();
    await expect(page).toHaveURL(/iana\.org/);
  });
});
