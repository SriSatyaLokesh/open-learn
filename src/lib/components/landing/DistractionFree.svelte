<!--
  @file src/lib/components/landing/DistractionFree.svelte
  @description Bento grid feature architecture showcasing the Focus Room:
  Ad-free theater canvas, synchronized Pomodoro timer, smart URL/playlist importer,
  and timestamped study notes.
-->
<script lang="ts">
	import { Bookmark, Timer, EyeOff, Link as LinkIcon, CircleCheck, ListPlus } from '@lucide/svelte';
	import { LANDING_DATA } from '#lib/content/landingData.js';

	const { distractionFree } = LANDING_DATA;
</script>

<section class="py-20 md:py-28 bg-page-subtle/40 relative">
  <div class="container max-w-6xl mx-auto px-4 sm:px-6">
    <!-- Section Header -->
    <div class="text-center max-w-3xl mx-auto mb-16 md:mb-20">
      <div class="badge-bracket mb-4">
        <span>{distractionFree.badge}</span>
      </div>
      <h2 class="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
        {distractionFree.titlePrefix}
        <em class="font-serif italic font-normal text-accent not-italic">
          {distractionFree.titleEmphasis}
        </em>
      </h2>
      <p class="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
        {distractionFree.subhead}
      </p>
    </div>

    <!-- Bento Grid Architecture -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
      <!-- Bento Card 1: Stripped Theater Mode (Span 7) -->
      <div class="lg:col-span-7 p-7 sm:p-8 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between">
        <div>
          <div class="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 text-accent flex items-center justify-center mb-5">
            <EyeOff class="w-5 h-5" />
          </div>
          <h3 class="font-heading text-xl sm:text-2xl font-bold text-charcoal mb-3">
            100% Distraction-Free Theater
          </h3>
          <p class="text-sm sm:text-base text-editorial-secondary leading-relaxed mb-6">
            Say goodbye to endless recommendation rabbit holes, algorithm trap sidebars, and doomscrolling comments. OpenLearn strips all peripheral noise so your attention stays locked on the lesson.
          </p>
        </div>

        <!-- Visual Mini Comparison Box -->
        <div class="p-4 rounded-xl bg-page border border-black/6 flex items-center justify-between text-xs font-mono">
          <div class="flex items-center gap-2 text-editorial-secondary">
            <span class="w-2.5 h-2.5 rounded-full bg-status-emerald"></span>
            <span>SIDEBAR: STRIPPED</span>
          </div>
          <div class="flex items-center gap-2 text-editorial-secondary">
            <span class="w-2.5 h-2.5 rounded-full bg-status-emerald"></span>
            <span>COMMENTS: STRIPPED</span>
          </div>
          <div class="flex items-center gap-2 text-editorial-secondary">
            <span class="w-2.5 h-2.5 rounded-full bg-status-emerald"></span>
            <span>SHORTS: 0%</span>
          </div>
        </div>
      </div>

      <!-- Bento Card 2: Synchronized Pomodoro (Span 5) -->
      <div class="lg:col-span-5 p-7 sm:p-8 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between">
        <div>
          <div class="w-10 h-10 rounded-xl bg-status-amber/10 border border-status-amber/25 text-status-amber flex items-center justify-center mb-5">
            <Timer class="w-5 h-5" />
          </div>
          <h3 class="font-heading text-xl sm:text-2xl font-bold text-charcoal mb-3">
            Synchronized Pomodoro
          </h3>
          <p class="text-sm sm:text-base text-editorial-secondary leading-relaxed mb-6">
            25-minute deep focus sprints synchronized directly with tutorial chapters. Subtle audio chimes signal transitions.
          </p>
        </div>

        <div class="p-4 rounded-xl bg-page border border-black/6 text-center">
          <div class="font-mono text-3xl font-extrabold text-charcoal">
            25:00
          </div>
          <div class="text-[11px] font-mono font-bold uppercase tracking-wider text-accent mt-1">
            Deep Work Interval Active
          </div>
        </div>
      </div>

      <!-- Bento Card 3: Smart URL & Playlist Importer (Span 6) -->
      <div class="lg:col-span-6 p-7 sm:p-8 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between">
        <div>
          <div class="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 text-accent flex items-center justify-center mb-5">
            <ListPlus class="w-5 h-5" />
          </div>
          <h3 class="font-heading text-xl sm:text-2xl font-bold text-charcoal mb-2">
            Smart URL & Playlist Importer
          </h3>
          <p class="text-sm text-editorial-secondary leading-relaxed mb-6">
            Paste any YouTube video or multi-part playlist link. OpenLearn parses chapters, removes algorithmic recommendations, and builds an organized curriculum queue.
          </p>

          <!-- Mock Importer Bar -->
          <div class="space-y-3">
            <div class="p-2.5 bg-page rounded-xl border border-black/6 flex items-center gap-2 text-xs font-mono">
              <LinkIcon class="w-3.5 h-3.5 text-editorial-muted flex-shrink-0" />
              <span class="text-editorial-muted truncate">https://youtube.com/playlist?list=PLrAXtmErZg...</span>
              <span class="badge-bracket text-[10px] ml-auto">IMPORT</span>
            </div>

            <div class="p-3 bg-white rounded-xl border border-black/6 text-xs flex items-center justify-between">
              <div class="flex items-center gap-2 truncate">
                <span class="font-mono font-bold text-accent">#1</span>
                <span class="font-semibold text-charcoal truncate">CS50 — Lecture 1: C & Memory</span>
              </div>
              <span class="text-status-emerald flex items-center gap-1 font-mono text-[11px]">
                <CircleCheck class="w-3.5 h-3.5" />
                <span>Parsed</span>
              </span>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-black/6 flex items-center justify-between text-xs font-mono text-editorial-muted">
          <span>OFFICIAL YOUTUBE IFRAME API</span>
          <span class="text-status-emerald font-semibold">NO EXTENSIONS</span>
        </div>
      </div>

      <!-- Bento Card 4: Timestamped Notes (Span 6) -->
      <div class="lg:col-span-6 p-7 sm:p-8 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between">
        <div>
          <div class="w-10 h-10 rounded-xl bg-status-emerald/10 border border-status-emerald/25 text-status-emerald flex items-center justify-center mb-5">
            <Bookmark class="w-5 h-5" />
          </div>
          <h3 class="font-heading text-xl sm:text-2xl font-bold text-charcoal mb-2">
            Timestamped Study Notes
          </h3>
          <p class="text-sm text-editorial-secondary leading-relaxed mb-6">
            Press a shortcut to capture an insight. Notes automatically bind to the video’s exact second:
          </p>

          <!-- Sample Notes Stack -->
          <div class="space-y-2.5">
            <div class="p-3 bg-page rounded-xl border border-black/6 flex items-center gap-3 text-xs">
              <span class="font-mono text-[11px] font-bold text-accent bg-accent/10 border border-accent/25 px-2 py-0.5 rounded">
                14:28
              </span>
              <span class="font-semibold text-charcoal truncate">
                Recursive splitter keeps code syntax intact
              </span>
            </div>
            <div class="p-3 bg-page rounded-xl border border-black/6 flex items-center gap-3 text-xs">
              <span class="font-mono text-[11px] font-bold text-accent bg-accent/10 border border-accent/25 px-2 py-0.5 rounded">
                22:05
              </span>
              <span class="font-semibold text-charcoal truncate">
                Cosine distance vs dot product normalization
              </span>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-black/6 flex items-center justify-between text-xs font-mono text-editorial-muted">
          <span>ONE-CLICK INSTANT REWIND</span>
          <span class="text-accent font-semibold">KEYBOARD SHORTCUTS</span>
        </div>
      </div>
    </div>
  </div>
</section>
