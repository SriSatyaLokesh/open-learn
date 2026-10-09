'use client';

/**
 * @file src/components/sections/BottomCta.tsx
 * @description Bottom conversion call-to-action banner for OpenLearn.
 * Encapsulated dark charcoal card featuring high-contrast typography, electric orange accent glow,
 * dual conversion buttons (primary start learning jump & curriculum exploration), and trust metadata.
 */

import React from 'react';
import { ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { LANDING_DATA } from '@/content/landingData';

export function BottomCta() {
  const { bottomCta } = LANDING_DATA;

  return (
    <section className="py-20 md:py-28 relative">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        <div className="p-10 sm:p-16 rounded-3xl bg-charcoal text-white text-center shadow-taste-lg relative overflow-hidden border border-black">
          {/* Subtle accent glow in background */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight">
              {bottomCta.headlinePrefix}{' '}
              <em className="font-serif italic font-normal text-accent not-italic">
                {bottomCta.headlineEmphasis}
              </em>
            </h2>

            <p className="font-sans text-base sm:text-lg text-white/70 leading-relaxed mb-8">
              {bottomCta.subhead}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <a
                href="#hero"
                className="btn btn-accent text-base px-8 py-4 shadow-taste-orange"
              >
                <span>{bottomCta.primaryCta}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#curriculum"
                className="btn bg-white/10 hover:bg-white/20 text-white border border-white/20 text-base px-7 py-4 backdrop-blur-sm"
              >
                <BookOpen className="w-4 h-4 text-accent" />
                <span>{bottomCta.secondaryCta}</span>
              </a>
            </div>

            <div className="text-xs font-mono text-white/50 tracking-wider uppercase">
              {bottomCta.metaNote}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
