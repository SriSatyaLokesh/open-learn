<!--
  @file src/lib/components/landing/OpenCurriculum.svelte
  @description Open curriculum model and Git-style forking flow (Create -> Learn -> Fork -> Share).
-->
<script lang="ts">
	import { GitBranch, GitFork, GitMerge, Share2, Sparkles } from '@lucide/svelte';
	import { LANDING_DATA } from '#lib/content/landingData.js';

	const { openLearning } = LANDING_DATA;

	const icons = [
		{ Icon: GitBranch, cls: 'w-5 h-5 text-accent' },
		{ Icon: Sparkles, cls: 'w-5 h-5 text-status-amber' },
		{ Icon: GitFork, cls: 'w-5 h-5 text-accent' },
		{ Icon: Share2, cls: 'w-5 h-5 text-status-emerald' }
	];
</script>

<section class="py-20 md:py-28 bg-page-subtle/40 relative">
  <div class="container max-w-6xl mx-auto px-4 sm:px-6">
    <!-- Section Header -->
    <div class="text-center max-w-3xl mx-auto mb-16 md:mb-20">
      <div class="badge-bracket mb-4">
        <span>{openLearning.badge}</span>
      </div>
      <h2 class="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
        {openLearning.titlePrefix}
        <em class="font-serif italic font-normal text-accent not-italic">
          {openLearning.titleEmphasis}
        </em>
      </h2>
      <p class="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
        {openLearning.subhead}
      </p>
    </div>

    <!-- 4 Flow Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
      {#each openLearning.principles as p, idx (p.step)}
        {@const { Icon, cls } = icons[idx]}
        <div
          class="p-6 sm:p-7 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-taste-md group"
        >
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="w-10 h-10 rounded-xl bg-page border border-black/6 flex items-center justify-center">
                <Icon class={cls} />
              </div>
              <span class="font-mono text-[11px] font-bold text-accent bg-accent/8 border border-accent/20 px-2 py-0.5 rounded-full">
                {p.step}
              </span>
            </div>

            <h3 class="font-heading font-bold text-lg text-charcoal mb-2">
              {p.title}
            </h3>

            <p class="text-xs sm:text-sm text-editorial-secondary leading-relaxed">
              {p.desc}
            </p>
          </div>

          <div class="mt-6 pt-4 border-t border-black/6 flex items-center justify-between text-[11px] font-mono text-editorial-muted">
            <span>PHASE 0{idx + 1}</span>
            <span class="text-accent group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      {/each}
    </div>

    <!-- Git For Knowledge Quote Callout -->
    <div class="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl bg-white border border-black/8 shadow-taste-sm text-center">
      <div class="inline-flex items-center gap-2 font-mono text-xs font-bold text-accent mb-2">
        <GitMerge class="w-4 h-4" />
        <span>GIT FOR KNOWLEDGE</span>
      </div>
      <p class="font-serif italic text-base sm:text-lg text-charcoal leading-relaxed mb-4">
        &ldquo;When software has a bug, the world submits a pull request. When an educational video is outdated or confusing, OpenLearn lets learners fork the curriculum and replace it with a superior explanation.&rdquo;
      </p>
      <div class="text-xs font-mono text-editorial-muted">
        CONTRIBUTE ON GITHUB • OPEN LICENSED MIT
      </div>
    </div>
  </div>
</section>
