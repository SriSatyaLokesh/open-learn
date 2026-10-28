<!--
  @file src/lib/components/layout/EditorialFooter.svelte
  @description Tactile editorial minimalist footer.
  Features brand identity, MIT open source badge, GitHub repository links,
  and structured footer navigation matching the TasteSkill design system.
-->
<script lang="ts">
	import { Zap, Icon, type IconNode } from '@lucide/svelte';
	import { LANDING_DATA } from '#lib/content/landingData.js';

	// @lucide/svelte 1.x dropped brand icons; this is the lucide-react 0.475 Github node, verbatim.
	const github: IconNode = [
		[
			'path',
			{
				d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4'
			}
		],
		['path', { d: 'M9 18c-4.51 2-5-2-7-2' }]
	];

	const { footer } = LANDING_DATA;
</script>

<footer class="pt-16 pb-12 bg-page-subtle/80 border-t border-black/8 text-charcoal">
	<div class="container max-w-6xl mx-auto px-4 sm:px-6">
		<div class="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-black/6">
			<!-- Brand Column (Span 2) -->
			<div class="md:col-span-2">
				<!-- svelte-ignore a11y_invalid_attribute (parity: React brand link is href="#") -->
				<a
					href="#"
					class="flex items-center gap-2.5 font-heading text-xl font-extrabold text-charcoal mb-3"
				>
					<div
						class="w-7 h-7 rounded-lg bg-charcoal text-white flex items-center justify-center text-xs shadow-sm"
					>
						<Zap class="w-3.5 h-3.5 text-accent fill-accent" />
					</div>
					<span>
						Open<em class="font-serif italic font-medium text-accent ml-0.5">Learn</em>
					</span>
				</a>
				<p class="font-sans text-sm text-editorial-secondary max-w-sm leading-relaxed mb-4">
					{footer.tagline}
				</p>
				<div class="flex items-center gap-3">
					<a
						href="https://github.com/open-learn"
						target="_blank"
						rel="noopener noreferrer"
						class="w-8 h-8 rounded-full bg-white border border-black/8 flex items-center justify-center text-editorial-secondary hover:text-charcoal hover:border-black/20 shadow-taste-sm transition-all"
						aria-label="OpenLearn GitHub"
					>
						<Icon iconNode={github} class="lucide-github w-4 h-4" />
					</a>
					<span class="font-mono text-xs text-editorial-muted"> MIT OPEN SOURCE </span>
				</div>
			</div>

			<!-- Links Column 1: Product -->
			<div>
				<h4 class="font-mono text-xs font-bold uppercase tracking-wider text-charcoal mb-4">
					Product
				</h4>
				<ul class="space-y-2.5 text-sm">
					{#each footer.links.product as link (link.label)}
						<li>
							<a href={link.href} class="text-editorial-secondary hover:text-accent transition-colors">
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Links Column 2: Community -->
			<div>
				<h4 class="font-mono text-xs font-bold uppercase tracking-wider text-charcoal mb-4">
					Community
				</h4>
				<ul class="space-y-2.5 text-sm">
					{#each footer.links.community as link (link.label)}
						<li>
							<a
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
								class="text-editorial-secondary hover:text-accent transition-colors"
							>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Links Column 3: Legal & Open Code -->
			<div>
				<h4 class="font-mono text-xs font-bold uppercase tracking-wider text-charcoal mb-4">
					Open Governance
				</h4>
				<ul class="space-y-2.5 text-sm">
					{#each footer.links.legal as link (link.label)}
						<li>
							<a href={link.href} class="text-editorial-secondary hover:text-accent transition-colors">
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- Bottom Bar -->
		<div
			class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-editorial-muted"
		>
			<div>{footer.copyright}</div>
			<div class="flex items-center gap-1">
				<span>Built with Tactile Editorial Modernism for deep learners</span>
			</div>
		</div>
	</div>
</footer>
