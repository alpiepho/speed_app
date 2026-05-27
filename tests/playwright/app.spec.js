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

test('rollingMedian returns median of last N values', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { rollingMedian } = await import('/js/speed.js');
    return rollingMedian([10, 50, 30, 20, 40], 5);
  });
  expect(result).toBe(30);
});

test('rollingMedian uses only last N values', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { rollingMedian } = await import('/js/speed.js');
    return rollingMedian([999, 999, 10, 20, 30], 3);
  });
  expect(result).toBe(20);
});

test('calcSideSpeed converts pixel velocity to mph', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { calcSideSpeed } = await import('/js/speed.js');
    return calcSideSpeed(
      { x: 220, y: 200, width: 80, height: 50 },
      { x: 100, y: 200, width: 80, height: 50 },
      0.1,
      800
    );
  });
  expect(result).toBeGreaterThan(55);
  expect(result).toBeLessThan(66);
});

test('calcFrontSpeed converts size growth to mph', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { calcFrontSpeed } = await import('/js/speed.js');
    return calcFrontSpeed(
      { x: 150, y: 180, width: 90, height: 60 },
      { x: 160, y: 190, width: 75, height: 50 },
      0.1,
      800
    );
  });
  expect(result).toBeGreaterThan(80);
  expect(result).toBeLessThan(100);
});

test('iou returns 1.0 for identical boxes', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { iou } = await import('/js/tracker.js');
    return iou([10, 10, 50, 50], [10, 10, 50, 50]);
  });
  expect(result).toBeCloseTo(1.0);
});

test('iou returns 0 for non-overlapping boxes', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { iou } = await import('/js/tracker.js');
    return iou([0, 0, 10, 10], [20, 20, 10, 10]);
  });
  expect(result).toBe(0);
});

test('Tracker locks onto largest detection', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { Tracker } = await import('/js/tracker.js');
    const t = new Tracker();
    const detections = [
      { bbox: [10, 10, 30, 30], score: 0.9, class: 'car' },
      { bbox: [100, 100, 80, 60], score: 0.85, class: 'car' },
    ];
    const locked = t.update(detections);
    return locked.bbox;
  });
  expect(result).toEqual([100, 100, 80, 60]);
});

test('Tracker returns null when no detections', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { Tracker } = await import('/js/tracker.js');
    const t = new Tracker();
    return t.update([]);
  });
  expect(result).toBeNull();
});

test('sim canvas becomes visible when SIM ON', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#sim-canvas')).toBeHidden();
  await page.locator('#sim-badge').tap();
  await expect(page.locator('#sim-badge')).toHaveText('SIM ON');
  await expect(page.locator('#sim-badge')).toHaveAttribute('data-sim', 'on');
});

test('SimulationMode draws a moving rectangle on canvas', async ({ page }) => {
  await page.goto('/');
  const moved = await page.evaluate(async () => {
    const { SimulationMode } = await import('/js/simulation.js');
    const canvas = document.createElement('canvas');
    canvas.width = 393; canvas.height = 600;
    document.body.appendChild(canvas);
    const sim = new SimulationMode(canvas, 35);
    sim.start();
    const x1 = sim._carX;
    await new Promise(r => setTimeout(r, 200));
    const x2 = sim._carX;
    sim.stop();
    return x2 > x1;
  });
  expect(moved).toBe(true);
});
