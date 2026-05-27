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
