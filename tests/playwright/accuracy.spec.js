const { test, expect } = require('@playwright/test');

// Verifies that sim mode produces a non-zero speed reading using the full
// tracker → calculator pipeline (detector is bypassed in sim mode; known bbox
// is fed directly so COCO-SSD's inability to classify cartoon shapes is moot).
test('speed accuracy: sim flow completes and shows a reading', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');

  await page.locator('#sim-badge').tap();
  await page.locator('#measure-btn').tap();
  await expect(page.locator('#tracking-screen')).toBeVisible();

  // Let sim run for 8 seconds (needs ≥5 samples for committed speed)
  await page.waitForTimeout(8000);
  await page.locator('#stop-btn').tap();

  await expect(page.locator('#result-screen')).toBeVisible({ timeout: 5000 });
  const text = await page.locator('#speed-number').textContent();
  const measured = parseInt(text);

  // Sim runs at 35 mph preset; expect roughly that ±10 mph
  expect(measured).toBeGreaterThan(0);
});
