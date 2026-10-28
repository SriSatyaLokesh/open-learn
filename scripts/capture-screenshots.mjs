// Capture the SPEC-0002 parity screenshot set from a running site.
// Usage: node scripts/capture-screenshots.mjs <baseUrl> <outDir>
// Selectors rely on class strings that the port keeps byte-identical, so the same script works on both builds.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [baseUrl, outDir] = process.argv.slice(2);
if (!baseUrl || !outDir) {
  console.error('Usage: node scripts/capture-screenshots.mjs <baseUrl> <outDir>');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const width of [375, 768, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const shot = (state, el) =>
    (el ?? page).screenshot({ path: join(outDir, `${width}-${state}.png`), ...(el ? {} : { fullPage: true }) });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await shot('full');

  if (width === 375) {
    await page.click('button[aria-label="Toggle navigation menu"]');
    await shot('menu-open', page.locator('header'));
    await page.click('button[aria-label="Toggle navigation menu"]');
  }

  const hero = page.locator('#hero');
  const queue = hero.locator('div.flex.flex-col.gap-2 > button');
  for (let i = 0; i < (await queue.count()); i++) {
    await queue.nth(i).click();
    await shot(`hero-q${i + 1}`, hero);
  }

  const path = page.locator('#curriculum');
  const nodes = path.locator('button.w-full.p-4');
  for (let i = 0; i < (await nodes.count()); i++) {
    await nodes.nth(i).click();
    await shot(`path-n${i + 1}`, path);
  }

  const practice = page.locator('#practice');
  const options = practice.locator('button.w-full.p-4');
  const seen = new Set();
  for (let i = 0; i < (await options.count()) && seen.size < 2; i++) {
    await options.nth(i).click();
    await practice.locator('button.btn-primary').click();
    const state = (await practice.getByText('CORRECT REINFORCEMENT').count()) ? 'correct' : 'incorrect';
    if (!seen.has(state)) {
      seen.add(state);
      await shot(`practice-${state}`, practice);
    }
    await practice.getByText('Try Again').click();
  }

  const faq = page.locator('#faq');
  await faq.locator('details').evaluateAll((els) => els.forEach((d) => (d.open = true)));
  await shot('faq-all-open', faq);
  await page.close();
}
await browser.close();
console.log(`Screenshots written to ${outDir}`);
