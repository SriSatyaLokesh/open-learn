import type { Page } from '@playwright/test';
import { open } from '../open.ts';

// Replaces the YouTube IFrame API with a recording fake (spec OQ-3).
export async function installFakeYT(page: Page): Promise<void> {
	await page.addInitScript(() => {
		type Ev = { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
		const w = window as unknown as Record<string, unknown>;
		const yt = { constructed: 0, cued: [] as unknown[], loaded: [] as unknown[], time: 0 } as Record<
			string,
			unknown
		>;
		let events: Ev = {};
		let iframe: HTMLIFrameElement;
		yt.setTime = (s: number) => (yt.time = s);
		yt.pause = () => events.onStateChange?.({ data: 2 });
		w.__yt = yt;
		w.YT = {
			Player: class {
				constructor(el: HTMLElement, opts: { events?: Ev }) {
					(yt.constructed as number)++;
					events = opts.events ?? {};
					iframe = document.createElement('iframe');
					iframe.style.cssText = 'width:100%;height:100%;border:0';
					el.replaceWith(iframe);
					setTimeout(() => events.onReady?.(), 0);
				}
				cueVideoById(a: unknown) {
					(yt.cued as unknown[]).push(a);
				}
				loadVideoById(a: unknown) {
					(yt.loaded as unknown[]).push(a);
				}
				getCurrentTime() {
					return yt.time;
				}
				getIframe() {
					return iframe;
				}
				destroy() {}
			}
		};
	});
}

// Drives /start the same way a user would; returns the public code.
export async function importPath(page: Page, urls: string[]): Promise<string> {
	await open(page, '/start');
	await page.getByLabel('YouTube video links, one per line').fill(urls.join('\n'));
	await page.getByRole('button', { name: 'Import' }).click();
	await page.waitForURL(/\/learn\?path=OL-[0-9A-Z]{5}$/);
	return new URL(page.url()).searchParams.get('path')!;
}
