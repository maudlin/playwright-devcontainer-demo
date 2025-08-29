import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://www.movewithus.co.uk/');
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('link', { name: 'Buying a new build?' }).click();
  await expect(page.locator('.pt-0')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toContainText('Part of Simplify www.simplify.co.uk');
});