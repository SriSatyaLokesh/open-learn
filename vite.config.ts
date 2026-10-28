import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// Absolute /_app/ URLs: 404.html is served at any depth (/a/b/), where ./_app would miss.
			paths: { relative: false },
			prerender: {
				// The 404 page reuses the header, whose links are same-page anchors (#faq, ...) from the
				// landing page; only there may they miss. Anywhere else a missing id stays a build error.
				handleMissingId: ({ path, message }) => {
					if (path !== '/404') throw new Error(message);
				}
			}
		})
	]
});
