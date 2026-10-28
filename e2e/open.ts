import type { Page } from '@playwright/test';

// goto resolves on `load`, which can precede hydration; wait for the network to settle so clicks hit live handlers.
export const open = (page: Page, path = '/') => page.goto(path, { waitUntil: 'networkidle' });
