<!--
  @file src/lib/components/landing/AudienceSection.svelte
  @description Learner persona matrix: friction points and tailored outcomes per persona.
-->
<script lang="ts">
	import { Terminal, GraduationCap, Compass, Lightbulb } from '@lucide/svelte';
	import { LANDING_DATA } from '#lib/content/landingData.js';

	const { personas } = LANDING_DATA;

	const icons = [
		{ Icon: Terminal, cls: 'w-5 h-5 text-accent' },
		{ Icon: GraduationCap, cls: 'w-5 h-5 text-status-amber' },
		{ Icon: Compass, cls: 'w-5 h-5 text-status-emerald' },
		{ Icon: Lightbulb, cls: 'w-5 h-5 text-accent' }
	];
</script>

<section class="py-20 md:py-28 relative">
  <div class="container max-w-6xl mx-auto px-4 sm:px-6">
    <!-- Section Header -->
    <div class="text-center max-w-3xl mx-auto mb-16 md:mb-20">
      <div class="badge-bracket mb-4">
        <span>WHO IT’S FOR</span>
      </div>
      <h2 class="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
        Built for people who learn from the
        <em class="font-serif italic font-normal text-accent not-italic">
          open web.
        </em>
      </h2>
      <p class="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
        If you learn online but struggle to stay organized, avoid rabbit holes, and finish what you start, OpenLearn gives you structure.
      </p>
    </div>

    <!-- 4 Persona Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
      {#each personas as persona, idx (persona.role)}
        {@const { Icon, cls } = icons[idx]}
        <div
          class="p-6 sm:p-7 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-taste-md group"
        >
          <div>
            <div class="flex items-center justify-between mb-5">
              <div class="w-10 h-10 rounded-xl bg-page border border-black/6 flex items-center justify-center">
                <Icon class={cls} />
              </div>
              <span class="font-mono text-[10px] font-bold text-editorial-muted tracking-wider">
                {persona.badge}
              </span>
            </div>

            <h3 class="font-heading font-bold text-lg text-charcoal mb-3">
              {persona.role}
            </h3>

            <div class="space-y-3 text-xs sm:text-sm">
              <div class="text-editorial-muted">
                <strong class="text-editorial-secondary font-semibold">{'The Friction' + ': '}</strong>
                <span>{persona.problem}</span>
              </div>
              <div class="text-editorial-secondary">
                <strong class="text-charcoal font-semibold">{'The Fix' + ': '}</strong>
                <span>{persona.outcome}</span>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-black/6 flex items-center justify-between text-[11px] font-mono text-editorial-muted">
            <span>TAILORED PATHWAYS</span>
            <span class="text-accent group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
