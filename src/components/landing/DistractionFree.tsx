'use client';

/**
 * @file src/components/landing/DistractionFree.tsx
 * @description Bento grid feature architecture showcasing the Focus Room:
 * Ad-free theater canvas, synchronized Pomodoro timer, smart URL/playlist importer,
 * and timestamped study notes.
 */

import React from 'react';
import {
  Bookmark,
  Timer,
  EyeOff,
  Link as LinkIcon,
  CheckCircle2,
  ListPlus,
  ArrowRight,
} from 'lucide-react';
import { LANDING_DATA } from '@/content/landingData';

export function DistractionFree() {
  const { distractionFree } = LANDING_DATA;

  return (
    <section className="py-20 md:py-28 bg-page-subtle/40 relative">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="badge-bracket mb-4">
            <span>{distractionFree.badge}</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
            {distractionFree.titlePrefix}{' '}
            <em className="font-serif italic font-normal text-accent not-italic">
              {distractionFree.titleEmphasis}
            </em>
          </h2>
          <p className="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
            {distractionFree.subhead}
          </p>
        </div>

        {/* Bento Grid Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
          {/* Bento Card 1: Stripped Theater Mode (Span 7) */}
          <div className="lg:col-span-7 p-7 sm:p-8 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 text-accent flex items-center justify-center mb-5">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-charcoal mb-3">
                100% Distraction-Free Theater
              </h3>
              <p className="text-sm sm:text-base text-editorial-secondary leading-relaxed mb-6">
                Say goodbye to endless recommendation rabbit holes, algorithm trap sidebars, and doomscrolling comments. OpenLearn strips all peripheral noise so your attention stays locked on the lesson.
              </p>
            </div>

            {/* Visual Mini Comparison Box */}
            <div className="p-4 rounded-xl bg-page border border-black/6 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-editorial-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-status-emerald" />
                <span>SIDEBAR: STRIPPED</span>
              </div>
              <div className="flex items-center gap-2 text-editorial-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-status-emerald" />
                <span>COMMENTS: STRIPPED</span>
              </div>
              <div className="flex items-center gap-2 text-editorial-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-status-emerald" />
                <span>SHORTS: 0%</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Synchronized Pomodoro (Span 5) */}
          <div className="lg:col-span-5 p-7 sm:p-8 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-status-amber/10 border border-status-amber/25 text-status-amber flex items-center justify-center mb-5">
                <Timer className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-charcoal mb-3">
                Synchronized Pomodoro
              </h3>
              <p className="text-sm sm:text-base text-editorial-secondary leading-relaxed mb-6">
                25-minute deep focus sprints synchronized directly with tutorial chapters. Subtle audio chimes signal transitions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-page border border-black/6 text-center">
              <div className="font-mono text-3xl font-extrabold text-charcoal">
                25:00
              </div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent mt-1">
                Deep Work Interval Active
              </div>
            </div>
          </div>

          {/* Bento Card 3: Smart URL & Playlist Importer (Span 6) */}
          <div className="lg:col-span-6 p-7 sm:p-8 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 text-accent flex items-center justify-center mb-5">
                <ListPlus className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-charcoal mb-2">
                Smart URL & Playlist Importer
              </h3>
              <p className="text-sm text-editorial-secondary leading-relaxed mb-6">
                Paste any YouTube video or multi-part playlist link. OpenLearn parses chapters, removes algorithmic recommendations, and builds an organized curriculum queue.
              </p>

              {/* Mock Importer Bar */}
              <div className="space-y-3">
                <div className="p-2.5 bg-page rounded-xl border border-black/6 flex items-center gap-2 text-xs font-mono">
                  <LinkIcon className="w-3.5 h-3.5 text-editorial-muted flex-shrink-0" />
                  <span className="text-editorial-muted truncate">https://youtube.com/playlist?list=PLrAXtmErZg...</span>
                  <span className="badge-bracket text-[10px] ml-auto">IMPORT</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-black/6 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold text-accent">#1</span>
                    <span className="font-semibold text-charcoal truncate">CS50 — Lecture 1: C & Memory</span>
                  </div>
                  <span className="text-status-emerald flex items-center gap-1 font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Parsed</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-black/6 flex items-center justify-between text-xs font-mono text-editorial-muted">
              <span>OFFICIAL YOUTUBE IFRAME API</span>
              <span className="text-status-emerald font-semibold">NO EXTENSIONS</span>
            </div>
          </div>

          {/* Bento Card 4: Timestamped Notes (Span 6) */}
          <div className="lg:col-span-6 p-7 sm:p-8 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-status-emerald/10 border border-status-emerald/25 text-status-emerald flex items-center justify-center mb-5">
                <Bookmark className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-charcoal mb-2">
                Timestamped Study Notes
              </h3>
              <p className="text-sm text-editorial-secondary leading-relaxed mb-6">
                Press a shortcut to capture an insight. Notes automatically bind to the video’s exact second:
              </p>

              {/* Sample Notes Stack */}
              <div className="space-y-2.5">
                <div className="p-3 bg-page rounded-xl border border-black/6 flex items-center gap-3 text-xs">
                  <span className="font-mono text-[11px] font-bold text-accent bg-accent/10 border border-accent/25 px-2 py-0.5 rounded">
                    14:28
                  </span>
                  <span className="font-semibold text-charcoal truncate">
                    Recursive splitter keeps code syntax intact
                  </span>
                </div>
                <div className="p-3 bg-page rounded-xl border border-black/6 flex items-center gap-3 text-xs">
                  <span className="font-mono text-[11px] font-bold text-accent bg-accent/10 border border-accent/25 px-2 py-0.5 rounded">
                    22:05
                  </span>
                  <span className="font-semibold text-charcoal truncate">
                    Cosine distance vs dot product normalization
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-black/6 flex items-center justify-between text-xs font-mono text-editorial-muted">
              <span>ONE-CLICK INSTANT REWIND</span>
              <span className="text-accent font-semibold">KEYBOARD SHORTCUTS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
