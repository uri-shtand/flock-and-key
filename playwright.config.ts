import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/browser', use: { baseURL: 'http://127.0.0.1:5186', headless: true, launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } }, webServer: { command: 'npm run dev -- --port 5186 --strictPort', url: 'http://127.0.0.1:5186', reuseExistingServer: false } });
