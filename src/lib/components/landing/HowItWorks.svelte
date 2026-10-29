<!--
  @file src/lib/components/landing/HowItWorks.svelte
  @description 5-step numbered cards explaining the OpenLearn workflow:
  STEP 01 Choose -> STEP 02 Follow -> STEP 03 Practice -> STEP 04 Track -> STEP 05 Finish.
-->
<script lang="ts">
	import { ArrowRight, Sparkles } from '@lucide/svelte';
	import { LANDING_DATA } from '#lib/content/landingData.js';

	const { howItWorks } = LANDING_DATA;
</script>

<section id="how-it-works" class="py-20 md:py-28 relative">
  <div class="container max-w-6xl mx-auto px-4 sm:px-6">
    <!-- Section Header -->
    <div class="text-center max-w-3xl mx-auto mb-16 md:mb-20">
      <div class="badge-bracket mb-4">
        <span>{howItWorks.badge}</span>
      </div>
      <h2 class="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
        {howItWorks.titlePrefix}
        <em class="font-serif italic font-normal text-accent not-italic">
          {howItWorks.titleEmphasis}
        </em>
      </h2>
      <p class="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
        {howItWorks.subhead}
      </p>
    </div>

    <!-- 5-Step Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each howItWorks.steps as step, idx (step.number)}
        {@const isLast = idx === howItWorks.steps.length - 1}
        <div
          class="p-7 sm:p-8 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-taste-md group {isLast
            ? 'md:col-span-2 lg:col-span-2 bg-[#FFFDFB] border-accent/30'
            : ''}"
        >
          <div>
            <div class="flex items-center justify-between mb-5">
              <span class="font-mono text-xs font-extrabold text-accent bg-accent/8 border border-accent/25 px-3 py-1 rounded-full">
                {step.number}
              </span>
              <span class="font-mono text-[11px] font-semibold text-editorial-muted tracking-wider">
                {step.tag}
              </span>
            </div>

            <h3 class="font-heading text-xl font-bold text-charcoal mb-3">
              {step.title}
            </h3>

            <p class="text-sm sm:text-base text-editorial-secondary leading-relaxed">
              {step.description}
            </p>
          </div>

          {#if isLast}
            <div class="mt-6 pt-4 border-t border-accent/20 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2 text-xs font-mono font-bold text-accent">
                <Sparkles class="w-4 h-4" />
                <span>CONTINUOUS MASTERY LOOP</span>
              </div>
              <a
                href="#curriculum"
                class="text-xs font-mono font-bold text-charcoal hover:text-accent flex items-center gap-1"
              >
                <span>TEST IT ON A PATH</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </a>
            </div>
          {:else}
            <div class="mt-6 pt-4 border-t border-black/6 flex items-center justify-between text-xs font-mono text-editorial-muted">
              <span>PROGRESSION PHASE 0{idx + 1}</span>
              <ArrowRight class="w-3.5 h-3.5 text-editorial-subtle group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>
