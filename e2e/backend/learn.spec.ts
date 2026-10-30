import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { installFakeYT, importPath } from './fake-yt.ts';

const A = 'https://youtu.be/dQw4w9WgXcQ';
const B = 'https://youtu.be/M7lc1UVf-VE';
type FakeWindow = { __yt: { constructed: number; cued: Record<string, unknown>[]; loaded: Record<string, unknown>[]; setTime(s: number): void; pause(): void; play(): void; ready(): void } };
const yt = <T>(page: Page, fn: (y: FakeWindow['__yt']) => T) =>
	page.evaluate(`(${fn})(window.__yt)`) as Promise<T>;
const isSave = (r: { url(): string }) => r.url().includes('rpc/save_position');

test.beforeEach(({ page }, info) =>
	info.title.includes('before ready') ? undefined : installFakeYT(page)
);

for (const [w, h] of [
	[360, 740],
	[768, 1024],
	[1280, 800]
]) {
	test(`player box is at least 200×200 and uncovered at ${w}`, async ({ page }) => {
		await page.setViewportSize({ width: w, height: h });
		await importPath(page, [A, B]);
		const box = page.getByTestId('player');
		await expect(box).toBeVisible();
		const b = (await box.boundingBox())!;
		expect(b.width).toBeGreaterThanOrEqual(200);
		expect(b.height).toBeGreaterThanOrEqual(200);
		const covered = await box.evaluate((el) => {
			const r = el.getBoundingClientRect();
			const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
			return !top || !el.contains(top);
		});
		expect(covered).toBe(false);
	});
}

test('resumes where the learner paused', async ({ page }) => {
	await importPath(page, [A, B]);
	await expect(page.getByTestId('player')).toBeVisible();
	await page.waitForFunction(() => (window as never as FakeWindow).__yt.cued.length > 0);
	await page.evaluate(() => {
		const y = (window as never as FakeWindow).__yt;
		y.setTime(90.4);
		y.pause();
	});
	await page.waitForResponse(isSave);
	await page.reload({ waitUntil: 'networkidle' });
	await page.waitForFunction(() => (window as never as FakeWindow).__yt.cued.length > 0);
	expect(await yt(page, (y) => y.cued.at(-1))).toEqual({ videoId: 'dQw4w9WgXcQ', startSeconds: 90 });
	await expect(page.getByText('Resumed at 1:30')).toBeVisible();
});

test('switching videos does not remount', async ({ page }) => {
	await importPath(page, [A, B]);
	await expect(page.getByTestId('player')).toBeVisible();
	const items = page.locator('[data-testid=video-list] button');
	await expect(items).toHaveCount(2);
	await items.nth(1).click();
	expect(await yt(page, (y) => y.constructed)).toBe(1);
	expect(await yt(page, (y) => (y.loaded.at(-1) as { videoId: string }).videoId)).toBe('M7lc1UVf-VE');
	await expect(items.nth(1)).toHaveAttribute('aria-current', 'true');
});

test('unknown and foreign codes say Path not found', async ({ page, browser }) => {
	const code = await importPath(page, [A]);
	await page.goto('/learn?path=OL-ZZZZZ', { waitUntil: 'networkidle' });
	await expect(page.getByText('Path not found')).toBeVisible();
	const ctx = await browser.newContext();
	const other = await ctx.newPage();
	await installFakeYT(other);
	await importPath(other, [B]);
	await other.goto('/learn?path=' + code, { waitUntil: 'networkidle' });
	await expect(other.getByText('Path not found')).toBeVisible();
	await ctx.close();
});

test('does not save a non-finite time', async ({ page }) => {
	await importPath(page, [A]);
	await page.waitForFunction(() => (window as never as FakeWindow).__yt.cued.length > 0);
	let saved = false;
	page.on('request', (r) => (saved ||= isSave(r)));
	await page.evaluate(() => {
		const y = (window as never as FakeWindow).__yt;
		y.setTime(NaN);
		y.pause();
	});
	await page.waitForTimeout(1000);
	expect(saved).toBe(false);
});

test('import failures are listed beside the player', async ({ page }) => {
	await importPath(page, [A, 'https://vimeo.com/1']);
	const item = page.getByRole('listitem').filter({ hasText: 'https://vimeo.com/1' });
	await expect(item).toBeVisible();
	const [i, p] = await Promise.all([item.boundingBox(), page.getByTestId('player').boundingBox()]);
	const overlap = i!.x < p!.x + p!.width && p!.x < i!.x + i!.width && i!.y < p!.y + p!.height && p!.y < i!.y + i!.height;
	expect(overlap).toBe(false);
});

test('robots and axe', async ({ page }) => {
	await importPath(page, [A, B]);
	await expect(page.getByTestId('player')).toBeVisible();
	await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
	await expect(page).toHaveTitle('Focus Room · OpenLearn');
	const { violations } = await new AxeBuilder({ page }).analyze();
	expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

type Save = { p_resource_id: string; p_seconds: number };
const recordSaves = (page: Page) => {
	const saves: Save[] = [];
	page.on('request', (r) => isSave(r) && saves.push(r.postDataJSON()));
	return saves;
};
const rid = (page: Page, n: number) =>
	page.locator('[data-testid=video-list] button').nth(n).getAttribute('data-resource-id');

test('click before ready cues the clicked video', async ({ page }) => {
	await installFakeYT(page, true);
	await importPath(page, [A, B]);
	const items = page.locator('[data-testid=video-list] button');
	await expect(items).toHaveCount(2);
	await items.nth(1).click();
	await page.evaluate('window.__yt.ready()');
	expect(await yt(page, (y) => (y.cued.at(-1) as { videoId: string }).videoId)).toBe('M7lc1UVf-VE');
	const saves = recordSaves(page);
	await page.evaluate('window.__yt.setTime(30); window.__yt.pause()');
	await expect.poll(() => saves.length).toBe(1);
	expect(saves[0]).toEqual({ p_resource_id: await rid(page, 1), p_seconds: 30 });
});

test('switching mid-play saves the outgoing video under its own id', async ({ page }) => {
	await importPath(page, [A, B]);
	await page.waitForFunction(() => (window as never as FakeWindow).__yt.cued.length > 0);
	const saves = recordSaves(page);
	await page.evaluate('window.__yt.play(); window.__yt.setTime(42)');
	await page.locator('[data-testid=video-list] button').nth(1).click();
	await expect.poll(() => saves.length).toBe(1);
	expect(saves[0]).toEqual({ p_resource_id: await rid(page, 0), p_seconds: 42 });
	await page.evaluate('window.__yt.setTime(5); window.__yt.pause()');
	await expect.poll(() => saves.length).toBe(2);
	expect(saves[1]).toEqual({ p_resource_id: await rid(page, 1), p_seconds: 5 });
});
