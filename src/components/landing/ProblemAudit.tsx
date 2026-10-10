'use client';

/**
 * @file src/components/landing/ProblemAudit.tsx
 * @description Comparative audit cards contrasting the YouTube attention trap with OpenLearn.
 * Visualizes the 97% abandon rate of unstructured YouTube playlists vs. the structured
 * concept progression and active retention of OpenLearn.
 */

import React from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { LANDING_DATA } from '@/content/landingData';

export function ProblemAudit() {
  const { audit } = LANDING_DATA;

  return (
    <section id="problem" className="py-20 md:py-28 relative">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="badge-bracket mb-4">
            <span>{audit.badge}</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
            {audit.titlePrefix}{' '}
            <em className="font-serif italic font-normal text-accent not-italic">
              {audit.titleEmphasis}
            </em>
          </h2>
          <p className="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
            {audit.subhead}
          </p>
        </div>

        {/* 2-Column Comparative Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Card A: The YouTube Doom Loop */}
          <article className="p-7 sm:p-9 rounded-2xl bg-white border border-status-rose/25 shadow-taste-sm flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs font-bold text-status-rose bg-status-rose-subtle px-3 py-1 rounded-full border border-status-rose/20">
                  REGULAR YOUTUBE
                </span>
                <span className="font-sans text-xs font-semibold text-editorial-muted">
                  The Attention Doom-Loop
                </span>
              </div>

              <h3 className="font-heading text-xl sm:text-2xl font-bold text-charcoal mb-6">
                Engineered for Attention Capture
              </h3>

              <ul className="space-y-4">
                {audit.youtubePainPoints.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3.5 text-sm sm:text-base text-editorial-secondary">
                    <div className="w-5 h-5 rounded-full bg-status-rose/10 text-status-rose flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div>
                      <strong className="text-charcoal font-semibold">{item.title}: </strong>
                      <span>{item.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-5 border-t border-black/6 flex items-center justify-between text-xs font-mono text-editorial-muted">
              <span>OUTCOME: 97% DROP-OFF RATE</span>
              <span className="text-status-rose font-bold">ABANDONED</span>
            </div>
          </article>

          {/* Card B: The OpenLearn Sanctuary */}
          <article className="p-7 sm:p-9 rounded-2xl bg-white border-2 border-accent/40 shadow-taste-md ring-1 ring-accent/20 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 relative">
            {/* Top highlight indicator */}
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-accent text-white font-mono text-[11px] font-bold px-3 py-0.5 rounded-full shadow-taste-orange">
              THE STRUCTURAL FIX
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/30">
                  OPENLEARN SANCTUARY
                </span>
                <span className="font-sans text-xs font-bold text-accent">
                  Engineered for Completion
                </span>
              </div>

              <h3 className="font-heading text-xl sm:text-2xl font-bold text-charcoal mb-6">
                Engineered Exclusively for Learning
              </h3>

              <ul className="space-y-4">
                {audit.openLearnSolutions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3.5 text-sm sm:text-base text-editorial-secondary">
                    <div className="w-5 h-5 rounded-full bg-status-emerald/10 text-status-emerald flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-charcoal font-semibold">{item.title}: </strong>
                      <span>{item.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-5 border-t border-black/6 flex items-center justify-between text-xs font-mono">
              <span className="text-editorial-muted">OUTCOME: RETENTION & PRACTICE</span>
              <a href="#curriculum" className="text-accent font-bold flex items-center gap-1 hover:underline">
                <span>SEE CURRICULUM</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
