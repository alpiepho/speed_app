const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    hasTouch: true,
    permissions: ['camera'],
  },
  webServer: {
    command: 'npx serve . -p 3000 --no-clipboard',
    cwd: require('path').resolve(__dirname, '../..'),
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
