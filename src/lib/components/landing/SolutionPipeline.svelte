<!--
  @file src/lib/components/landing/SolutionPipeline.svelte
  @description Linear transformation diagram showing the 5-stage paradigm shift:
  Scattered Content -> Structured Concepts -> Active Practice -> Tracked Progress -> Verified Completion.
-->
<script lang="ts">
	import { ArrowRight, Layers, FileText, CircleCheckBig, Flame, Award } from '@lucide/svelte';
	import { LANDING_DATA } from '#lib/content/landingData.js';

	const { transformation } = LANDING_DATA;

	const icons = [
		{ Icon: FileText, cls: 'w-5 h-5 text-editorial-secondary' },
		{ Icon: Layers, cls: 'w-5 h-5 text-accent' },
		{ Icon: CircleCheckBig, cls: 'w-5 h-5 text-status-emerald' },
		{ Icon: Flame, cls: 'w-5 h-5 text-status-amber' },
		{ Icon: Award, cls: 'w-5 h-5 text-accent' }
	];
</script>

<section class="py-14 md:py-20 bg-page-subtle/60 border-y border-black/6">
  <div class="container max-w-6xl mx-auto px-4 sm:px-6">
    <div class="text-center max-w-2xl mx-auto mb-12">
      <div class="badge-bracket mb-3">
        <span>{transformation.badge}</span>
      </div>
      <h2 class="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-charcoal">
        {transformation.headline}
      </h2>
      <p class="font-sans text-sm sm:text-base text-editorial-secondary mt-2">
        {transformation.subhead}
      </p>
    </div>

    <!-- Linear Horizontal Pipeline -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
      {#each transformation.nodes as node, index (node.step)}
        {@const { Icon, cls } = icons[index]}
        <div
          class="p-5 rounded-2xl bg-white border border-black/6 shadow-taste-sm flex flex-col justify-between relative group hover:border-accent/40 transition-all duration-200"
        >
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="w-9 h-9 rounded-xl bg-page flex items-center justify-center">
                <Icon class={cls} />
              </div>
              <span class="font-mono text-xs font-bold text-editorial-muted">
                {node.step}
              </span>
            </div>
            <h3 class="font-heading font-bold text-base text-charcoal mb-1">
              {node.title}
            </h3>
            <p class="text-xs text-editorial-secondary leading-relaxed">
              {node.desc}
            </p>
          </div>

          <!-- Step indicator arrow for desktop -->
          {#if index < transformation.nodes.length - 1}
            <div class="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-page border border-black/8 items-center justify-center text-editorial-muted shadow-sm">
              <ArrowRight class="w-3.5 h-3.5" />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>
