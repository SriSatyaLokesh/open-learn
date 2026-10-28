import { existsSync } from 'node:fs';
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
		// The source drawer has no duration (only the node card shows it), so nothing to assert here.
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
		// After submit, picking another option changes nothing (React ignores it too).
		await option(idx === wrong ? q.correctIndex : wrong).click();
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

test('prerendered HTML contains copy', async ({ request }) => {
	const html = await (await request.get('/')).text();
	expect(html).toContain(D.hero.headlinePrefix);
	expect(html).toContain(D.hero.headlineEmphasis);
	for (const { question } of D.faq) expect(html).toContain(question);
});

test('unknown path is a styled 404', async ({ page }) => {
	const res = await page.goto('/does-not-exist');
	expect(res?.status()).toBe(404);
	expect(new URL(page.url()).pathname).toBe('/does-not-exist');
	await expect(page.getByRole('heading', { level: 1, name: 'Page not found.' })).toBeVisible();
	await expect(page.locator('main .badge-bracket')).toHaveText('404');
	await expect(page.locator('main a[href="/"]')).toBeVisible();
	await expect(page.locator('header').first()).toBeVisible();
	// Static hosts serve this file for unknown paths; preview renders +error.svelte instead.
	expect(existsSync('build/404.html')).toBe(true);
});

test('keyboard reaches and operates controls', async ({ page }, testInfo) => {
	await page.goto('/');
	const tabTo = async (target: import('@playwright/test').Locator) => {
		for (let i = 0; i < 300; i++) {
			if (await target.evaluate((el) => el === document.activeElement)) return;
			await page.keyboard.press('Tab');
		}
		throw new Error('target not reachable by Tab');
	};

	if (testInfo.project.name === 'mobile-chromium') {
		const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
		await tabTo(toggle);
		await page.keyboard.press('Enter');
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await page.keyboard.press('Enter');
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	}

	const queue = D.hero.mockup.queue;
	const heroBtn = page.locator('#hero').getByRole('button').filter({ hasText: queue[0].title });
	await tabTo(heroBtn);
	await page.keyboard.press('Enter');
	await expect(heroBtn).toHaveAttribute('aria-pressed', 'true');

	const curriculum = page.locator('#curriculum');
	const node = D.curriculumVisualizer.samplePath.nodes[0];
	const nodeBtn = curriculum.getByRole('button').filter({ hasText: node.title });
	await tabTo(nodeBtn);
	await page.keyboard.press('Space');
	await expect(nodeBtn).toHaveAttribute('aria-pressed', 'true');
	await expect(curriculum.locator('h4')).toHaveText(node.title);

	const practice = page.locator('#practice');
	const q = D.practice.sampleQuestions[0];
	await tabTo(practice.getByRole('button').filter({ hasText: q.options[q.correctIndex] }));
	await page.keyboard.press('Enter');
	await tabTo(practice.getByRole('button', { name: 'Check Answer' }));
	await page.keyboard.press('Enter');
	await expect(practice.locator('[aria-live="polite"]')).toContainText('CORRECT REINFORCEMENT');
});

test('reduced motion disables animation and smooth scroll', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	// Show the practice feedback so an .animate-in element is present too.
	const practice = page.locator('#practice');
	const q = D.practice.sampleQuestions[0];
	await practice.getByRole('button').filter({ hasText: q.options[0] }).click();
	await practice.getByRole('button', { name: 'Check Answer' }).click();

	const animated = page.locator(
		'.animate-sensorBlink, .animate-soundChipPulse, .animate-badgePop, .animate-pulse, .animate-in'
	);
	const names = await animated.evaluateAll((els) =>
		els.map((el) => ({ cls: el.getAttribute('class') ?? '', anim: getComputedStyle(el).animationName }))
	);
	for (const cls of ['animate-sensorBlink', 'animate-pulse', 'animate-in'])
		expect(names.some((n) => n.cls.includes(cls))).toBe(true);
	for (const n of names) expect(n.anim, n.cls).toBe('none');
	const transitioned = page.locator('.transition-all, .transition-transform, .transition-colors');
	await expect(transitioned.first()).toBeAttached();
	const durations = await transitioned.evaluateAll((els) =>
		els.map((el) => getComputedStyle(el).transitionDuration)
	);
	for (const d of durations) expect(d).toBe('0s');
	expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
		'auto'
	);
});
