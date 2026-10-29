<!--
  @file src/routes/+error.svelte
  @description Not-found page in site style. Rendered by Kit for unknown paths and prerendered
  to build/404.html via src/routes/404/+page.svelte (adapter-static emits no 404.html on its own).
  shortcut: hardcodes 404 because every route prerenders, so a missing path is the only runtime error; show page.status if dynamic routes appear.
-->
<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="py-28 md:py-40 relative">
	<div class="container max-w-2xl mx-auto px-4 sm:px-6 text-center">
		<div class="badge-bracket mb-6">404</div>
		<h1 class="font-heading text-4xl sm:text-6xl font-extrabold tracking-tighter text-charcoal leading-[1.12] mb-5">
			Page <em class="font-serif italic font-normal text-accent not-italic">not found.</em>
		</h1>
		<p class="font-sans text-lg text-editorial-secondary leading-relaxed mb-8">
			The page you are looking for does not exist or has moved.
		</p>
		<a href="/" class="btn btn-primary text-base px-8 py-4">
			<span>Back to OpenLearn</span>
			<ArrowRight class="w-4 h-4" />
		</a>
	</div>
</section>
