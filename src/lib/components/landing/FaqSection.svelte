<!--
  @file src/lib/components/landing/FaqSection.svelte
  @description Frequently asked questions using semantic details/summary accordions.
-->
<script lang="ts">
	import { LANDING_DATA } from '#lib/content/landingData.js';

	const { faq } = LANDING_DATA;
</script>

<section id="faq" class="py-20 md:py-28 bg-page-subtle/50 relative">
  <div class="container max-w-4xl mx-auto px-4 sm:px-6">
    <!-- Section Header -->
    <div class="text-center max-w-2xl mx-auto mb-16 md:mb-20">
      <div class="badge-bracket mb-4">
        <span>CLARITY FIRST</span>
      </div>
      <h2 class="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
        Frequently asked
        <em class="font-serif italic font-normal text-accent not-italic">
          questions.
        </em>
      </h2>
      <p class="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
        Direct, transparent answers about OpenLearn, YouTube integrations, and curriculum forking.
      </p>
    </div>

    <!-- Semantic Accordion List -->
    <div class="space-y-4">
      {#each faq as item, idx (item.id)}
        <details
          class="group p-6 rounded-2xl bg-white border border-black/8 shadow-taste-sm transition-all duration-200 open:border-accent/30 open:shadow-taste-md"
          open={idx === 0}
        >
          <summary class="font-heading text-lg font-bold text-charcoal cursor-pointer list-none flex items-center justify-between gap-4 select-none">
            <span>{item.question}</span>
            <span class="font-mono text-xl font-semibold text-accent transition-transform duration-200 group-open:rotate-45">
              +
            </span>
          </summary>

          <div class="mt-4 pt-4 border-t border-black/6 text-editorial-secondary text-sm sm:text-base leading-relaxed space-y-2">
            <p class="font-semibold text-charcoal">
              {item.directAnswer}
            </p>
            <p class="text-editorial-secondary text-sm leading-relaxed">
              {item.detailedAnswer}
            </p>
          </div>
        </details>
      {/each}
    </div>
  </div>
</section>
