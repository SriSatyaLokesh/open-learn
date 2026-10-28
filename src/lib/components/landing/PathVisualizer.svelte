<!--
  @file src/lib/components/landing/PathVisualizer.svelte
  @description Interactive concept hierarchy curriculum viewer.
  Demonstrates the Foundations of RAG path with prerequisite nodes, durations,
  active concept highlights, and an expandable concept inspector drawer.
-->
<script lang="ts">
	import { Clock, Sparkles, GitBranch, ArrowRight, BookOpen, Check } from '@lucide/svelte';
	import { LANDING_DATA } from '#lib/content/landingData.js';

	const { curriculumVisualizer } = LANDING_DATA;
	let selectedNodeId = $state('n3');

	const selectedNode = $derived(
		curriculumVisualizer.samplePath.nodes.find((n) => n.id === selectedNodeId) ||
			curriculumVisualizer.samplePath.nodes[2]
	);
</script>

<section id="curriculum" class="py-20 md:py-28 relative">
  <div class="container max-w-6xl mx-auto px-4 sm:px-6">
    <!-- Section Header -->
    <div class="text-center max-w-3xl mx-auto mb-16 md:mb-20">
      <div class="badge-bracket mb-4">
        <span>{curriculumVisualizer.badge}</span>
      </div>
      <h2 class="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
        {curriculumVisualizer.titlePrefix}
        <em class="font-serif italic font-normal text-accent not-italic">
          {curriculumVisualizer.titleEmphasis}
        </em>
      </h2>
      <p class="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
        {curriculumVisualizer.subhead}
      </p>
    </div>

    <!-- Visualizer Shell -->
    <div class="max-w-5xl mx-auto p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-black/8 shadow-taste-md">
      <!-- Header Bar -->
      <div class="pb-5 mb-6 border-b border-black/6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-xs font-bold text-accent bg-accent/8 border border-accent/25 px-2.5 py-0.5 rounded-full">
              FEATURED CURRICULUM
            </span>
            <span class="text-xs font-mono text-editorial-muted">
              {curriculumVisualizer.samplePath.category}
            </span>
          </div>
          <h3 class="font-heading text-xl sm:text-2xl font-bold text-charcoal">
            {curriculumVisualizer.samplePath.title}
          </h3>
        </div>
        <a
          href="#practice"
          class="btn btn-secondary text-xs px-4 py-2"
        >
          <GitBranch class="w-3.5 h-3.5 text-accent" />
          <span>Fork This Path</span>
        </a>
      </div>

      <!-- Interactive Layout: Left Node Tree, Right Details Drawer -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left Node Tree (Span 7) -->
        <div class="lg:col-span-7 space-y-3 relative">
          <!-- Connecting vertical line -->
          <div class="absolute left-6 top-6 bottom-6 w-0.5 bg-black/6 -z-0 hidden sm:block"></div>

          {#each curriculumVisualizer.samplePath.nodes as node (node.id)}
            {@const isSelected = node.id === selectedNodeId}
            {@const isCompleted = node.status === 'completed'}
            {@const isActive = node.status === 'active'}
            <button
              type="button"
              onclick={() => (selectedNodeId = node.id)}
              aria-pressed={isSelected}
              class={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all duration-150 relative z-10 ${
                isSelected
                  ? 'bg-[#FFF9F7] border-accent shadow-taste-sm ring-1 ring-accent/30'
                  : 'bg-page/40 border-black/6 hover:bg-page/80'
              }`}
            >
              <!-- Status Circle Badge -->
              <div
                class={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5 ${
                  isCompleted
                    ? 'bg-status-emerald text-white'
                    : isActive
                      ? 'bg-accent text-white shadow-taste-orange'
                      : 'bg-white border border-black/10 text-editorial-muted'
                }`}
              >
                {#if isCompleted}<Check class="w-4 h-4 stroke-[3]" />{:else}{node.stepNumber}{/if}
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <span class="font-heading font-bold text-sm sm:text-base text-charcoal truncate">
                    {node.title}
                  </span>
                  <span class="font-mono text-xs text-editorial-muted flex items-center gap-1">
                    <Clock class="w-3 h-3" />
                    {node.duration}
                  </span>
                </div>

                <div class="flex items-center gap-3 text-xs text-editorial-muted">
                  <span>{node.creator}</span>
                  {#if node.hasPractice}
                    <span class="badge-bracket text-[10px] py-0 px-2">
                      PRACTICE CHECKPOINT
                    </span>
                  {/if}
                </div>
              </div>
            </button>
          {/each}
        </div>

        <!-- Right Detailed Node Inspector (Span 5) -->
        <div class="lg:col-span-5 p-6 rounded-2xl bg-page border border-black/6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="font-mono text-xs font-bold text-accent">
                CONCEPT {selectedNode.stepNumber} INSPECTOR
              </span>
              <span
                class={`font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  selectedNode.status === 'completed'
                    ? 'bg-status-emerald/10 text-status-emerald'
                    : selectedNode.status === 'active'
                      ? 'bg-accent/15 text-accent'
                      : 'bg-black/5 text-editorial-muted'
                }`}
              >
                {selectedNode.status.toUpperCase()}
              </span>
            </div>

            <h4 class="font-heading text-lg font-bold text-charcoal mb-3">
              {selectedNode.title}
            </h4>

            <div class="text-xs font-mono text-editorial-muted mb-4">
              Instructor: <span class="font-semibold text-charcoal">{selectedNode.creator}</span>
            </div>

            <div class="p-4 rounded-xl bg-white border border-black/6 mb-4">
              <div class="text-xs font-bold uppercase tracking-wider text-charcoal mb-1 flex items-center gap-1.5">
                <BookOpen class="w-3.5 h-3.5 text-accent" />
                <span>Core Learning Objective</span>
              </div>
              <p class="text-xs text-editorial-secondary leading-relaxed">
                {selectedNode.conceptSummary}
              </p>
            </div>

            {#if selectedNode.hasPractice}
              <div class="p-4 rounded-xl bg-[#FFFDFB] border border-accent/20">
                <div class="text-xs font-bold uppercase tracking-wider text-accent mb-1 flex items-center gap-1.5">
                  <Sparkles class="w-3.5 h-3.5" />
                  <span>Built-in Practice Checkpoint</span>
                </div>
                <p class="text-xs text-editorial-secondary leading-relaxed">
                  Reinforce comprehension before moving to the next node. Solve a mini-drill or answer active recall reflection prompts.
                </p>
              </div>
            {/if}
          </div>

          <div class="mt-6 pt-4 border-t border-black/6">
            <a
              href="#practice"
              class="btn btn-primary w-full text-xs sm:text-sm py-2.5 justify-center"
            >
              <span>Launch Practice Checkpoint</span>
              <ArrowRight class="w-3.5 h-3.5 text-accent" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
