<!--
  @file src/lib/components/landing/PracticeDemo.svelte
  @description Interactive "Learn by Doing" checkpoint sandbox.
  Simulates active recall practice drills with instant feedback to prove
  OpenLearn reinforces retention instead of passive video consumption.
-->
<script lang="ts">
	import { CircleCheck, CircleX, ArrowRight, RotateCcw } from '@lucide/svelte';
	import { LANDING_DATA } from '#lib/content/landingData.js';

	const { practice } = LANDING_DATA;
	const question = practice.sampleQuestions[0];

	let selectedOption = $state<number | null>(null);
	let submitted = $state(false);

	const isCorrect = $derived(selectedOption === question.correctIndex);

	const handleSelect = (index: number) => {
		if (!submitted) {
			selectedOption = index;
		}
	};

	const handleReset = () => {
		selectedOption = null;
		submitted = false;
	};

	const optionStyles = (idx: number, isSelected: boolean) => {
		if (submitted) {
			if (idx === question.correctIndex) {
				return 'bg-status-emerald/10 border-status-emerald text-charcoal font-semibold';
			} else if (isSelected) {
				return 'bg-status-rose/10 border-status-rose text-charcoal';
			}
			return 'opacity-50 border-black/6 bg-page/30';
		} else if (isSelected) {
			return 'bg-[#FFF9F7] border-accent text-accent font-semibold ring-1 ring-accent/30';
		}
		return 'bg-page/60 border-black/6 hover:bg-page hover:border-black/15 text-charcoal';
	};
</script>

<section id="practice" class="py-20 md:py-28 bg-page-subtle/50 relative">
  <div class="container max-w-6xl mx-auto px-4 sm:px-6">
    <!-- Section Header -->
    <div class="text-center max-w-3xl mx-auto mb-16 md:mb-20">
      <div class="badge-bracket mb-4">
        <span>{practice.badge}</span>
      </div>
      <h2 class="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
        {practice.titlePrefix}
        <em class="font-serif italic font-normal text-accent not-italic">
          {practice.titleEmphasis}
        </em>
      </h2>
      <p class="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
        {practice.subhead}
      </p>
    </div>

    <!-- Practice Sandbox Card -->
    <div class="max-w-3xl mx-auto p-6 sm:p-9 rounded-2xl sm:rounded-3xl bg-white border border-black/8 shadow-taste-md">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 mb-6 border-b border-black/6">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-accent"></span>
          <span class="font-mono text-xs font-bold text-charcoal uppercase tracking-wider">
            {question.concept}
          </span>
        </div>
        <span class="badge-bracket text-[10px]">
          LIVE DEMO
        </span>
      </div>

      <!-- Question Text -->
      <h3 class="font-heading text-lg sm:text-xl font-bold text-charcoal mb-6 leading-snug">
        {question.question}
      </h3>

      <!-- Options -->
      <div class="space-y-3 mb-6">
        {#each question.options as opt, idx (idx)}
          {@const isSelected = selectedOption === idx}
          <button
            type="button"
            onclick={() => handleSelect(idx)}
            class={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all duration-150 text-sm sm:text-base ${optionStyles(idx, isSelected)}`}
          >
            <span class="font-mono text-xs font-bold w-6 h-6 rounded-full border border-current flex items-center justify-center flex-shrink-0 mt-0.5">
              {String.fromCharCode(65 + idx)}
            </span>
            <span class="flex-1">{opt}</span>
            {#if submitted && idx === question.correctIndex}
              <CircleCheck class="w-5 h-5 text-status-emerald flex-shrink-0" />
            {/if}
            {#if submitted && isSelected && !isCorrect}
              <CircleX class="w-5 h-5 text-status-rose flex-shrink-0" />
            {/if}
          </button>
        {/each}
      </div>

      <!-- Feedback & Actions (unstyled wrapper: the live region must exist before submit to be announced) -->
      <div aria-live="polite">
        {#if submitted}
          <div class="p-4 rounded-xl bg-page border border-black/6 animate-in fade-in duration-200">
            <div class="flex items-center justify-between mb-2">
              <span class={`font-mono text-xs font-bold ${isCorrect ? 'text-status-emerald' : 'text-status-rose'}`}>
                {isCorrect ? 'CORRECT REINFORCEMENT' : 'INCORRECT RETRIEVAL'}
              </span>
              <button
                type="button"
                onclick={handleReset}
                class="text-xs font-mono text-editorial-secondary hover:text-charcoal flex items-center gap-1"
              >
                <RotateCcw class="w-3 h-3" />
                <span>Try Again</span>
              </button>
            </div>
            <p class="text-xs sm:text-sm text-editorial-secondary leading-relaxed">
              {question.explanation}
            </p>
          </div>
        {:else}
          <div class="flex items-center justify-between pt-2">
            <span class="text-xs font-mono text-editorial-muted">
              SELECT AN ANSWER TO TEST YOUR RETENTION
            </span>
            <button
              type="button"
              disabled={selectedOption === null}
              onclick={() => (submitted = true)}
              class={`btn btn-primary text-xs sm:text-sm px-6 py-2.5 ${
                selectedOption === null ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <span>Check Answer</span>
              <ArrowRight class="w-3.5 h-3.5 text-accent" />
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>
