import { expect, test } from '@playwright/test';
import { importPath } from './fake-yt.ts';

test('@real-youtube shows the real YouTube iframe', async ({ page }) => {
	await importPath(page, ['https://youtu.be/dQw4w9WgXcQ']);
	await expect(page.locator('iframe[src*="youtube.com/embed"]')).toBeVisible({ timeout: 15_000 });
});
