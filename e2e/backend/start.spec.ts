import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { open } from '../open.ts';
import { authKey } from './helpers.ts';

// Distinct ids per run: ingest dedupes against the DB, so reuse could change results.
const id = () => Math.random().toString(36).slice(2, 13).padEnd(11, 'x');
const fill = (page: import('@playwright/test').Page, text: string) =>
	page.getByLabel('YouTube video links, one per line').fill(text);
const importBtn = (page: import('@playwright/test').Page) =>
	page.getByRole('button', { name: 'Import' });

test('no guest is created until Import', async ({ page }) => {
	await open(page, '/start');
	expect(await authKey(page)).toBeNull();
	await fill(page, `https://youtu.be/${id()}\nhttps://youtu.be/${id()}`);
	await importBtn(page).click();
	await expect(page).toHaveURL(/\/learn\?path=OL-[0-9A-Z]{5}$/);
	expect(await authKey(page)).not.toBeNull();
});

test('double submit creates one path', async ({ page }) => {
	let posts = 0;
	page.on('request', (r) => {
		if (r.method() === 'POST' && r.url().includes('/functions/v1/ingest')) posts++;
	});
	let release!: () => void;
	const held = new Promise<void>((r) => (release = r));
	await page.route('**/functions/v1/ingest', async (route) => {
		await held;
		await route.continue();
	});
	await open(page, '/start');
	await fill(page, `https://youtu.be/${id()}`);
	await importBtn(page).dblclick();
	await expect(page.getByRole('button', { name: 'Importing…' })).toBeDisabled();
	release();
	await expect(page).toHaveURL(/\/learn\?path=OL-/);
	expect(posts).toBe(1);
});

test('all-failing input stays on /start', async ({ page }) => {
	await open(page, '/start');
	await fill(page, 'https://vimeo.com/1');
	await importBtn(page).click();
	const alert = page.getByRole('alert');
	await expect(alert).toContainText('https://vimeo.com/1');
	await expect(alert).toContainText(/invalid/i);
	await expect(page).toHaveURL(/\/start$/);
});

test('robots and axe', async ({ page }) => {
	await open(page, '/start');
	await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
	await expect(page).toHaveTitle('Import · OpenLearn');
	const { violations } = await new AxeBuilder({ page }).analyze();
	expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

test('duplicate invalid lines are both listed', async ({ page }) => {
	const errors: Error[] = [];
	page.on('pageerror', (e) => errors.push(e));
	await open(page, '/start');
	await fill(page, 'https://vimeo.com/1\nhttps://vimeo.com/1');
	await importBtn(page).click();
	await expect(page.getByRole('listitem').filter({ hasText: 'https://vimeo.com/1' })).toHaveCount(2);
	expect(errors).toEqual([]);
});

test('whitespace-only submit creates no guest and makes no request', async ({ page }) => {
	let posts = 0;
	page.on('request', (r) => r.url().includes('/functions/v1/ingest') && posts++);
	await open(page, '/start');
	await fill(page, '  \n ');
	await importBtn(page).click();
	await expect(page.getByRole('alert')).toContainText('Paste at least one YouTube link');
	expect(await authKey(page)).toBeNull();
	expect(posts).toBe(0);
});

test('all-junk submit lists tokens, creates no guest and makes no request', async ({ page }) => {
	let posts = 0;
	page.on('request', (r) => r.url().includes('/functions/v1/ingest') && posts++);
	await open(page, '/start');
	await fill(page, 'not-a-link');
	await importBtn(page).click();
	await expect(page.getByRole('alert')).toContainText('not-a-link');
	expect(await authKey(page)).toBeNull();
	expect(posts).toBe(0);
});
