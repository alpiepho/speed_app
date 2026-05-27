const { test, expect } = require('@playwright/test');

test('manifest is linked and valid', async ({ page }) => {
  await page.goto('/');
  const manifestHref = await page.$eval('link[rel="manifest"]', el => el.href);
  expect(manifestHref).toContain('manifest.json');

  const resp = await page.request.get('/manifest.json');
  expect(resp.status()).toBe(200);
  const json = await resp.json();
  expect(json.name).toBe('SpeedApp');
  expect(json.display).toBe('fullscreen');
  expect(json.icons.length).toBeGreaterThan(0);
});

test('icon SVG is reachable', async ({ page }) => {
  const resp = await page.request.get('/icon.svg');
  expect(resp.status()).toBe(200);
  const body = await resp.text();
  expect(body).toContain('55');
});

test('loads with capture screen visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#capture-screen')).toBeVisible();
  await expect(page.locator('#tracking-screen')).toBeHidden();
  await expect(page.locator('#result-screen')).toBeHidden();
});

test('showScreen() switches screens', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window._showScreen('tracking-screen'));
  await expect(page.locator('#tracking-screen')).toBeVisible();
  await expect(page.locator('#capture-screen')).toBeHidden();
});

test('mode badge toggles SIDE / FRONT on tap', async ({ page }) => {
  await page.goto('/');
  const badge = page.locator('#mode-badge');
  await expect(badge).toHaveText('SIDE');
  await badge.tap();
  await expect(badge).toHaveText('FRONT');
  await badge.tap();
  await expect(badge).toHaveText('SIDE');
});

test('sim badge toggles SIM OFF / SIM ON on tap', async ({ page }) => {
  await page.goto('/');
  const badge = page.locator('#sim-badge');
  await expect(badge).toHaveText('SIM OFF');
  await badge.tap();
  await expect(badge).toHaveText('SIM ON');
});
