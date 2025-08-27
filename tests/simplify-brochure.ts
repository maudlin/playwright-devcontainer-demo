import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://www.simplify.co.uk/');
  await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible();
  await page.getByRole('button', { name: 'Accept' }).click();
  await expect(page.getByRole('contentinfo')).toContainText('Simplify is the trading name of Simplify Moving Limited, the group which includes My Home Move Ltd (03874320), Move with Us Ltd (03883536) and all current subsidiaries. All Registered in England & Wales. Full details available from Companies House. © 2025 Simplify | All Rights Reserved');
  await page.getByRole('navigation').getByRole('link', { name: 'Contact Us' }).click();
  await expect(page.getByRole('main')).toContainText('New & existing customers');
});