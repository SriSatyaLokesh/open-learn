import type { Page } from '@playwright/test';

export const authKey = (page: Page): Promise<string | null> =>
	page.evaluate(
		() => Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k)) ?? null
	);
