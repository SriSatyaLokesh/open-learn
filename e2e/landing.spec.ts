import { expect, test } from '@playwright/test';
import { LANDING_DATA as D } from '../src/lib/content/landingData.ts';

const TITLE = 'OpenLearn — Turn Online Content Into Learning You Can Finish';
const DESCRIPTION =
	'OpenLearn turns scattered videos from YouTube and the open web into structured learning paths with practice, progress tracking, and verified completion.';
const KEYWORDS =
	'OpenLearn,Open Curriculum,YouTube Learning,Self-Taught Developers,Structured Learning,Active Recall,Distraction-Free Learning';

test('head metadata matches SPEC-0001', async ({ request, page }) => {
	// Assert on the prerendered HTML (no JS), then parse it with the browser's DOMParser.
	const html = await (await request.get('/')).text();
	const head = await page.evaluate((src) => {
		const doc = new DOMParser().parseFromString(src, 'text/html');
		const meta = (sel: string) => doc.querySelector(`meta[${sel}]`)?.getAttribute('content');
		return {
			title: doc.title,
			description: meta('name="description"'),
			keywords: meta('name="keywords"'),
			author: meta('name="author"'),
			ogTitle: meta('property="og:title"'),
			ogDescription: meta('property="og:description"'),
			ogType: meta('property="og:type"'),
			ogLocale: meta('property="og:locale"'),
			ogSiteName: meta('property="og:site_name"'),
			twitterCard: meta('name="twitter:card"'),
			twitterTitle: meta('name="twitter:title"'),
			twitterDescription: meta('name="twitter:description"')
		};
	}, html);

	expect(head).toEqual({
		title: TITLE,
		description: DESCRIPTION,
		keywords: KEYWORDS,
		author: 'OpenLearn Community',
		ogTitle: TITLE,
		ogDescription: DESCRIPTION,
		ogType: 'website',
		ogLocale: 'en_US',
		ogSiteName: 'OpenLearn',
		twitterCard: 'summary_large_image',
		twitterTitle: TITLE,
		twitterDescription: DESCRIPTION
	});
});

test('mobile menu toggles and closes on link click', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile-only behaviour');
	await page.goto('/');

	const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(toggle).toHaveAttribute('aria-controls', 'mobile-menu');

	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	const menu = page.locator('#mobile-menu');
	for (const label of ['The Problem', 'How It Works', 'Curricula', 'Practice', 'FAQ']) {
		await expect(menu.getByRole('link', { name: label, exact: true })).toBeVisible();
	}

	await menu.getByRole('link', { name: 'FAQ', exact: true }).click();
	await expect(menu).toBeHidden();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('serif italic resolves to Newsreader italic', async ({ page }) => {
	await page.goto('/');
	const em = page.locator('header em.font-serif.italic');
	const style = await em.evaluate((el) => {
		const cs = getComputedStyle(el);
		return { family: cs.fontFamily, style: cs.fontStyle };
	});
	expect(style.family).toContain('Newsreader Variable');
	expect(style.style).toBe('italic');
	// The italic face itself must be loaded, not synthesised from the upright one.
	const loaded = await page.evaluate(async () => {
		await document.fonts.ready;
		return document.fonts.check('italic 500 16px "Newsreader Variable"', 'Learn') &&
			[...document.fonts].some(
				(f) => f.family.includes('Newsreader Variable') && f.style === 'italic' && f.status === 'loaded'
			);
	});
	expect(loaded).toBe(true);
});

// SPEC-0001 order, restricted to sections ported so far; Task 5 switches to absolute indices.
const SECTIONS: { id?: string; heading: string }[] = [
	{ id: 'problem', heading: D.audit.titlePrefix },
	{ heading: D.transformation.headline },
	{ id: 'how-it-works', heading: D.howItWorks.titlePrefix },
	{ heading: D.distractionFree.titlePrefix },
	{ heading: 'Always know where you are and' },
	{ heading: D.openLearning.titlePrefix },
	{ heading: 'Built for people who learn from the' },
	{ id: 'faq', heading: 'Frequently asked' },
	{ heading: D.bottomCta.headlinePrefix }
];

test('sections render in SPEC-0001 order', async ({ page }) => {
	await page.goto('/');
	const sections = page.locator('main > section');
	await expect(sections).toHaveCount(SECTIONS.length);
	const found = await sections.evaluateAll((els) =>
		els.map((el) => ({ id: el.id, h2: el.querySelector('h2')?.textContent?.replace(/\s+/g, ' ') ?? '' }))
	);
	SECTIONS.forEach((s, i) => {
		if (s.id) expect(found[i].id).toBe(s.id);
		expect(found[i].h2).toContain(s.heading);
	});
});

test('faq first open, others toggle independently', async ({ page }) => {
	await page.goto('/');
	const items = page.locator('#faq details');
	await expect(items.first()).toHaveAttribute('open', '');
	const n = await items.count();
	for (let i = 1; i < n; i++) await expect(items.nth(i)).not.toHaveAttribute('open', '');
	await items.nth(2).locator('summary').click();
	await expect(items.nth(0)).toHaveAttribute('open', '');
	await expect(items.nth(2)).toHaveAttribute('open', '');
	await items.nth(0).locator('summary').click();
	await expect(items.nth(0)).not.toHaveAttribute('open', '');
	await expect(items.nth(2)).toHaveAttribute('open', '');
});
