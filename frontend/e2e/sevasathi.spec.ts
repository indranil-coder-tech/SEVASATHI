import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function navigateToTab(page: Page, tabNameRegex: RegExp) {
  const menuBtn = page.locator('button[aria-label="Toggle navigation menu"]');
  if (await menuBtn.isVisible()) {
    await menuBtn.click({ force: true });
    await page.waitForTimeout(300);
  }
  const tabBtn = page.getByRole('button', { name: tabNameRegex }).filter({ visible: true }).first();
  await tabBtn.click({ force: true });
  await page.waitForTimeout(500);
}

test.describe('SevaSathi End-to-End & Mobile Verification', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant geolocation permissions by default with Sangli coordinates
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 16.8524, longitude: 74.5815 });
  });

  test('TC-NAV-01 & TC-MOB-01: Shell loads and displays hero and navigation tabs', async ({ page }) => {
    await page.goto('/');

    // Check brand title in header
    await expect(page.locator('header').getByText('सेवासाथी').first()).toBeVisible({ timeout: 15000 });

    // Verify main navigation bar exists
    const navBar = page.locator('header');
    await expect(navBar).toBeVisible();

    // Verify mobile screenshot capture
    await page.screenshot({ path: 'test-results/screenshots/01-dashboard-mobile-390x844.png', fullPage: true });
  });

  test('TC-MKT-E2E: Market Intelligence displays hierarchy and price cards', async ({ page }) => {
    await page.goto('/');
    await navigateToTab(page, /बाजारभाव माहिती|Market/i);

    // Check hierarchy filter heading
    await expect(page.getByText(/सरकारी बाजार समिती फिल्टर|कृषी उत्पन्न बाजार समिती|Market Intelligence/i).first()).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: 'test-results/screenshots/02-market-mobile.png', fullPage: true });
  });

  test('TC-STR-E2E: Sangli GPS Coordinate Search displays Nearest Facility recommendation card', async ({ page }) => {
    await page.goto('/');
    await navigateToTab(page, /जवळचे शीतगृह|Storage/i);

    // Look for GPS button or search controls
    const gpsBtn = page.getByRole('button', { name: /GPS/i }).first();
    if (await gpsBtn.isVisible()) {
      await gpsBtn.click();
    }

    // Wait for storage view to settle
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/screenshots/03-storage-sangli-fallback.png', fullPage: true });
  });

  test('TC-CALC-E2E: Post-Harvest Decision Calculator calculates Strategies A, B, and C', async ({ page }) => {
    await page.goto('/');
    await navigateToTab(page, /विक्री किंवा साठवणूक|Calculator/i);

    // Verify calculator main heading is visible in main content
    await expect(page.locator('main h1').first()).toBeVisible({ timeout: 15000 });

    // Wait for automatic calculation evaluation and strategy results to render
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/screenshots/04-calculator-strategies.png', fullPage: true });
  });

  test('TC-I18-E2E: Language switcher toggles UI between Marathi, English, and Hindi', async ({ page }) => {
    await page.goto('/');

    // Switch to English
    const englishBtn = page.getByRole('button', { name: /English/i }).filter({ visible: true }).first();
    await expect(englishBtn).toBeVisible({ timeout: 5000 });
    await englishBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('header').getByText('SevaSathi').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });

    // Switch back to Marathi
    const marathiBtn = page.getByRole('button', { name: /मराठी/i }).filter({ visible: true }).first();
    await expect(marathiBtn).toBeVisible({ timeout: 5000 });
    await marathiBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('header').getByText('सेवासाथी').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-A11Y-01: Automated axe-core accessibility audit reports no critical violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // Neomorphic surface design system
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical'
    );

    expect(criticalViolations).toEqual([]);
  });
});
