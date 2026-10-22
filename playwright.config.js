// Tests sous WebKit (moteur de Safari), iPad en paysage.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'webkit',
    locale: 'fr-FR'
  },
  projects: [
    // Écran de l'iPad Air 2 : 1024×768 points, 2048×1536 pixels réels.
    { name: 'ipad-1024x768', use: { viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2 } },
    { name: 'paysage-2048x1536', use: { viewport: { width: 2048, height: 1536 } } }
  ],
  webServer: {
    command: 'node tests/serve.js 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true
  }
});
