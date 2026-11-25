import { defineConfig } from '@playwright/test';
const port = Number(process.env.FLOCK_E2E_PORT ?? 5186);
if (!Number.isInteger(port) || port < 1024 || port > 65535 || port === 5173) throw new Error('Choose an E2E port other than 5173.');
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL, headless: true, launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } },
  webServer: { command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`, url: baseURL, reuseExistingServer: false },
});
