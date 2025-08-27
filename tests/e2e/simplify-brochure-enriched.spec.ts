import { test, expect } from '@playwright/test';

test('Visitor can reach Contact Us and see customer section', async ({ page }) => {
  await test.step('Open the Simplify homepage', async () => {
    await page.goto('https://www.simplify.co.uk/');
    await expect(page).toHaveURL(/simplify\.co\.uk/i);
    await expect(page).toHaveTitle(/simplify/i);
  });

  await test.step('Handle cookie consent banner (if shown)', async () => {
    const accept = page.getByRole('button', { name: /accept/i });
    if (await accept.isVisible()) {
      await accept.click();
      await expect(accept).toBeHidden();
    }
  });

  await test.step('Verify the legal disclaimer is visible in the footer', async () => {
    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText(/Simplify is the trading name of Simplify Moving Limited/i);
  });

  await test.step('Open the Contact Us page from the main navigation', async () => {
    const contactLink = page.getByRole('navigation').getByRole('link', { name: /contact us/i });
    await contactLink.click();
    await expect(page).toHaveURL(/contact/i);
  });

  await test.step('Verify the Contact page shows “New & existing customers”', async () => {
    await expect(page.getByRole('main')).toContainText(/New & existing customers/i);
  });
});
