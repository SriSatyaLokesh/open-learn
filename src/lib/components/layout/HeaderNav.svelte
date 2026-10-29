<!--
  @file src/lib/components/layout/HeaderNav.svelte
  @description Floating capsule glass navigation header.
  Sticky pill layout with frosted glass backdrop blur, brand mark with electric orange Zap,
  section jump anchors, mobile drawer menu, and primary action CTAs.
-->
<script lang="ts">
	import { Zap, Menu, X, ArrowRight, BookOpen } from '@lucide/svelte';
	import { LANDING_DATA } from '#lib/content/landingData.js';

	let mobileMenuOpen = $state(false);
	const { nav } = LANDING_DATA;
</script>

<header class="sticky top-4 z-50 w-full px-4 sm:px-6 max-w-7xl mx-auto mb-6">
	<nav
		class="w-full px-5 py-3 bg-white/85 backdrop-blur-md border border-black/8 rounded-full shadow-taste-sm flex items-center justify-between gap-4 transition-all duration-200"
		aria-label="Main Navigation"
	>
		<!-- Brand Logo -->
		<!-- svelte-ignore a11y_invalid_attribute (parity: React brand link is href="#") -->
		<a
			href="#"
			class="flex items-center gap-2.5 font-heading text-xl font-extrabold text-charcoal tracking-tight group"
		>
			<div
				class="w-8 h-8 rounded-lg bg-charcoal text-white flex items-center justify-center text-sm shadow-sm transition-transform duration-200 group-hover:scale-105"
			>
				<Zap class="w-4 h-4 text-accent fill-accent" />
			</div>
			<span class="flex items-center">
				Open<em class="font-serif italic font-medium text-accent ml-0.5">Learn</em>
			</span>
		</a>

		<!-- Desktop Navigation Links -->
		<div class="hidden md:flex items-center gap-7">
			{#each nav.links as link (link.href)}
				<a
					href={link.href}
					class="text-sm font-semibold text-editorial-secondary hover:text-charcoal transition-colors duration-150"
				>
					{link.label}
				</a>
			{/each}
		</div>

		<!-- Right CTA Actions -->
		<div class="hidden sm:flex items-center gap-3">
			<a
				href="#curriculum"
				class="btn btn-secondary text-xs sm:text-sm px-4 py-2 text-editorial-secondary hover:text-charcoal"
			>
				<BookOpen class="w-3.5 h-3.5 text-editorial-muted" />
				<span>Explore Paths</span>
			</a>
			<a href="#hero" class="btn btn-primary text-xs sm:text-sm px-5 py-2 text-white">
				<span>{nav.primaryCta}</span>
				<ArrowRight class="w-3.5 h-3.5 text-accent" />
			</a>
		</div>

		<!-- Mobile Hamburger Toggle -->
		<button
			type="button"
			onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			class="md:hidden p-2 text-charcoal hover:bg-black/5 rounded-full transition-colors"
			aria-label="Toggle navigation menu"
			aria-expanded={mobileMenuOpen}
			aria-controls="mobile-menu"
		>
			{#if mobileMenuOpen}<X class="w-5 h-5" />{:else}<Menu class="w-5 h-5" />{/if}
		</button>
	</nav>

	<!-- Mobile Drawer Menu -->
	{#if mobileMenuOpen}
		<div
			id="mobile-menu"
			class="md:hidden mt-2 p-5 bg-white/95 backdrop-blur-lg border border-black/8 rounded-2xl shadow-taste-md flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200"
		>
			<div class="flex flex-col gap-3">
				{#each nav.links as link (link.href)}
					<a
						href={link.href}
						onclick={() => (mobileMenuOpen = false)}
						class="text-sm font-semibold text-editorial-secondary hover:text-charcoal py-1 transition-colors"
					>
						{link.label}
					</a>
				{/each}
			</div>
			<div class="pt-3 border-t border-black/6 flex flex-col gap-2.5">
				<a
					href="#curriculum"
					onclick={() => (mobileMenuOpen = false)}
					class="btn btn-secondary w-full text-sm py-2.5 justify-center"
				>
					<BookOpen class="w-4 h-4 text-editorial-muted" />
					<span>Explore Paths</span>
				</a>
				<a
					href="#hero"
					onclick={() => (mobileMenuOpen = false)}
					class="btn btn-primary w-full text-sm py-2.5 justify-center"
				>
					<span>{nav.primaryCta}</span>
					<ArrowRight class="w-4 h-4 text-accent" />
				</a>
			</div>
		</div>
	{/if}
</header>
