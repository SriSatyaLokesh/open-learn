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

// SPEC-0001 order: all 12 sections at absolute indices (hero has an h1, not an h2).
const SECTIONS: { id?: string; heading?: string }[] = [
	{ id: 'hero' },
	{ id: 'problem', heading: D.audit.titlePrefix },
	{ heading: D.transformation.headline },
	{ id: 'how-it-works', heading: D.howItWorks.titlePrefix },
	{ heading: D.distractionFree.titlePrefix },
	{ id: 'curriculum', heading: D.curriculumVisualizer.titlePrefix },
	{ id: 'practice', heading: D.practice.titlePrefix },
	{ heading: 'Always know where you are and' },
	{ heading: D.openLearning.titlePrefix },
	{ heading: 'Built for people who learn from the' },
	{ id: 'faq', heading: 'Frequently asked' },
	{ heading: D.bottomCta.headlinePrefix }
];

test('sections render in SPEC-0001 order', async ({ page }) => {
	await page.goto('/');
	const sections = page.locator('main > section');
	await expect(sections).toHaveCount(12);
	const found = await sections.evaluateAll((els) =>
		els.map((el) => ({ id: el.id, h2: el.querySelector('h2')?.textContent?.replace(/\s+/g, ' ') ?? '' }))
	);
	SECTIONS.forEach((s, i) => {
		if (s.id) expect(found[i].id).toBe(s.id);
		if (s.heading) expect(found[i].h2).toContain(s.heading);
	});
});

test('hero: q3 active by default, clicking switches concept', async ({ page }) => {
	await page.goto('/');
	const hero = page.locator('#hero');
	const queue = D.hero.mockup.queue;
	const btn = (title: string) => hero.getByRole('button').filter({ hasText: title });
	await expect(btn(queue[2].title)).toHaveAttribute('aria-pressed', 'true');
	await expect(hero.getByText(`Active Concept: ${queue[2].title}`)).toBeVisible();
	for (const item of queue) {
		await btn(item.title).click();
		await expect(btn(item.title)).toHaveAttribute('aria-pressed', 'true');
		await expect(hero.getByText(`Active Concept: ${item.title}`)).toBeVisible();
		await expect(hero.getByRole('heading', { name: `${item.step}: ${item.title}` })).toBeVisible();
		for (const other of queue.filter((q) => q.id !== item.id))
			await expect(btn(other.title)).toHaveAttribute('aria-pressed', 'false');
	}
});

test('path: n3 default, node click updates drawer', async ({ page }) => {
	await page.goto('/');
	const section = page.locator('#curriculum');
	const nodes = D.curriculumVisualizer.samplePath.nodes;
	const drawer = section.locator('h4').locator('xpath=../..');
	const btn = (title: string) => section.getByRole('button').filter({ hasText: title });
	await expect(btn(nodes[2].title)).toHaveAttribute('aria-pressed', 'true');
	await expect(section.locator('h4')).toHaveText(nodes[2].title);
	for (const node of nodes) {
		await btn(node.title).click();
		await expect(btn(node.title)).toHaveAttribute('aria-pressed', 'true');
		await expect(section.locator('h4')).toHaveText(node.title);
		await expect(drawer).toContainText(`Instructor: ${node.creator}`);
		await expect(drawer).toContainText(node.conceptSummary);
		await expect(btn(node.title)).toContainText(node.duration);
	}
});

test('practice: submit disabled until selection; correct/incorrect; reset', async ({ page }) => {
	await page.goto('/');
	const section = page.locator('#practice');
	const q = D.practice.sampleQuestions[0];
	const submit = section.getByRole('button', { name: 'Check Answer' });
	const live = section.locator('[aria-live="polite"]');
	const option = (i: number) => section.getByRole('button').filter({ hasText: q.options[i] });
	const wrong = q.correctIndex === 0 ? 1 : 0;

	for (const [idx, label] of [
		[q.correctIndex, 'CORRECT REINFORCEMENT'],
		[wrong, 'INCORRECT RETRIEVAL']
	] as const) {
		await expect(submit).toBeDisabled();
		await option(idx).click();
		await expect(submit).toBeEnabled();
		await submit.click();
		await expect(live).toContainText(label);
		await expect(live).toContainText(q.explanation);
		await live.getByRole('button', { name: 'Try Again' }).click();
		await expect(live).not.toContainText(q.explanation);
	}
	await expect(submit).toBeDisabled();
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
