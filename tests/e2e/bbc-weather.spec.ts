import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://www.bbc.co.uk/weather');
  await page.getByRole('combobox', { name: 'Enter a town, city or UK' }).click();
  await page.getByRole('combobox', { name: 'Enter a town, city or UK' }).fill('leicester');
  await page.getByRole('link', { name: 'Leicester, Leicester' }).click();
});