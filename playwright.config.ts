import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	retries: process.env.CI ? 1 : 0,
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	},
	use: { baseURL: 'http://localhost:4173' },
	projects: [
		{
			name: 'desktop-chromium',
			use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
			testIgnore: 'backend/**'
		},
		{
			name: 'mobile-chromium',
			use: { browserName: 'chromium', viewport: { width: 375, height: 812 } },
			testIgnore: 'backend/**'
		},
		{
			name: 'backend',
			testMatch: 'backend/**/*.spec.ts',
			// Needs the local Supabase stack; set PUBLIC_SUPABASE_URL (and the anon key) to run.
			grep: process.env.PUBLIC_SUPABASE_URL ? /.*/ : /^$/,
			use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } }
		}
	]
});
