import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	retries: process.env.CI ? 1 : 0,
	webServer: { command: 'pnpm build && pnpm preview', port: 4173 },
	use: { baseURL: 'http://localhost:4173' },
	projects: [
		{
			name: 'desktop-chromium',
			use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } }
		},
		{
			name: 'mobile-chromium',
			use: { browserName: 'chromium', viewport: { width: 375, height: 812 } }
		}
	]
});
