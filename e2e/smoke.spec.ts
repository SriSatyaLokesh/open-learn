import { expect, test } from '@playwright/test';

test('home responds 200 with no console errors', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') errors.push(msg.text());
	});
	page.on('pageerror', (err) => errors.push(err.message));

	const response = await page.goto('/');
	await page.waitForLoadState('networkidle');

	expect(response?.status()).toBe(200);
	expect(errors).toEqual([]);
});
