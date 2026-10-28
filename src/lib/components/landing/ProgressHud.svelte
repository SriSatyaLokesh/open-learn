<!--
  @file src/lib/components/landing/ProgressHud.svelte
  @description Course continuity, daily streaks, and scholar trophy cabinet.
  Shows the persistent resume frontier, 7-day focus streak counter with amber glow,
  and tangible achievement milestone badges.
-->
<script lang="ts">
	import { Flame, Play } from '@lucide/svelte';

	const badges = [
		{ id: 'b1', name: 'Deep Diver', desc: '5 consecutive Pomodoro focus cycles', icon: '🎯', unlocked: true },
		{ id: 'b2', name: '7-Day Streak', desc: 'Active learning 7 days in a row', icon: '🔥', unlocked: true },
		{ id: 'b3', name: 'Concept Master', desc: 'Passed 10 practice checkpoints', icon: '⚡', unlocked: true },
		{ id: 'b4', name: 'Path Finisher', desc: 'Completed full curriculum track', icon: '🎓', unlocked: false }
	];
	const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
</script>

<section class="py-20 md:py-28 relative">
  <div class="container max-w-6xl mx-auto px-4 sm:px-6">
    <!-- Section Header -->
    <div class="text-center max-w-3xl mx-auto mb-16 md:mb-20">
      <div class="badge-bracket mb-4">
        <span>CONTINUITY & MOMENTUM</span>
      </div>
      <h2 class="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
        Always know where you are and
        <em class="font-serif italic font-normal text-accent not-italic">
          what comes next.
        </em>
      </h2>
      <p class="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
        OpenLearn is built to help you finish instead of starting over. Pick up right where you paused with persistent state and momentum mechanics.
      </p>
    </div>

    <!-- HUD Grid -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-5xl mx-auto">
      <!-- Active Course Continuity Card (Span 7) -->
      <div class="md:col-span-7 p-7 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="font-mono text-xs font-bold text-accent bg-accent/8 border border-accent/25 px-2.5 py-0.5 rounded-full">
              RESUME FRONTIER
            </span>
            <span class="font-mono text-xs text-editorial-muted">
              LAST ACTIVE: TODAY
            </span>
          </div>

          <h3 class="font-heading text-xl sm:text-2xl font-bold text-charcoal mb-2">
            Foundations of Retrieval-Augmented Generation
          </h3>
          <p class="text-xs sm:text-sm text-editorial-secondary mb-6">
            Next up: <strong class="text-charcoal font-semibold">Node 4 — Vector Databases & Approximate Nearest Neighbors</strong>
          </p>

          <!-- Progress Bar & Stats -->
          <div class="p-4 rounded-xl bg-page border border-black/6 mb-6">
            <div class="flex items-center justify-between text-xs font-mono mb-2">
              <span class="font-bold text-charcoal">CURRICULUM COMPLETION</span>
              <span class="font-bold text-accent">3 of 6 Concepts (50%)</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-black/10 overflow-hidden">
              <div class="h-full bg-accent rounded-full transition-all duration-500 w-1/2"></div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/6">
          <div class="text-xs font-mono text-editorial-muted">
            3 CONCEPTS COMPLETED • 1 CHECKPOINT PENDING
          </div>
          <a
            href="#curriculum"
            class="btn btn-primary text-xs sm:text-sm px-5 py-2.5"
          >
            <Play class="w-3.5 h-3.5 text-accent fill-accent" />
            <span>Resume Learning</span>
          </a>
        </div>
      </div>

      <!-- Daily Streak & Momentum Card (Span 5) -->
      <div class="md:col-span-5 p-7 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="font-mono text-xs font-bold text-status-amber bg-status-amber-subtle px-2.5 py-0.5 rounded-full border border-status-amber/20">
              DAILY STREAK
            </span>
            <span class="font-mono text-xs text-editorial-muted">
              +120 XP TODAY
            </span>
          </div>

          <div class="flex items-baseline gap-3 mb-2">
            <span class="font-mono text-4xl sm:text-5xl font-extrabold text-charcoal">
              7
            </span>
            <span class="font-heading text-lg font-bold text-editorial-secondary">
              Days in Continuous Flow
            </span>
          </div>

          <p class="text-xs sm:text-sm text-editorial-secondary leading-relaxed mb-6">
            Consistent daily sessions protect your working memory. Log at least 15 minutes to preserve your flame.
          </p>

          <!-- Days of the week row -->
          <div class="grid grid-cols-7 gap-1.5 text-center font-mono text-[11px]">
            {#each days as day, i (i)}
              <div
                class="py-2 rounded-lg border flex flex-col items-center gap-1 {i < 6
                  ? 'bg-status-amber/10 border-status-amber/30 text-status-amber font-bold'
                  : 'bg-page border-black/6 text-editorial-muted'}"
              >
                <span>{day}</span>
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
              </div>
            {/each}
          </div>
        </div>

        <div class="pt-4 border-t border-black/6 flex items-center justify-between text-xs font-mono text-editorial-muted">
          <span>LONGEST STREAK: 14 DAYS</span>
          <span class="text-status-amber font-bold flex items-center gap-1">
            <Flame class="w-3.5 h-3.5 fill-status-amber" />
            ACTIVE
          </span>
        </div>
      </div>

      <!-- Scholar Trophy Showcase (Span 12) -->
      <div class="md:col-span-12 p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-page-subtle/70 border border-black/8">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h4 class="font-heading font-bold text-lg text-charcoal">
              Scholar Achievement Trophies
            </h4>
            <p class="text-xs text-editorial-secondary">
              Meaningful milestones unlocked through real retention, not cheap vanity badges.
            </p>
          </div>
          <span class="badge-bracket text-[10px]">
            3 UNLOCKED / 1 LOCKED
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {#each badges as badge (badge.id)}
            <div
              class="p-4 rounded-xl border flex items-start gap-3 transition-all {badge.unlocked
                ? 'bg-white border-black/8 shadow-taste-sm'
                : 'bg-page/40 border-dashed border-black/15 opacity-60'}"
            >
              <div class="text-2xl p-2 rounded-lg bg-page flex items-center justify-center">
                {badge.icon}
              </div>
              <div>
                <div class="font-heading font-bold text-sm text-charcoal">
                  {badge.name}
                </div>
                <div class="text-xs text-editorial-secondary mt-0.5">
                  {badge.desc}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</section>
