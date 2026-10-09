'use client';

/**
 * @file src/components/sections/HowItWorks.tsx
 * @description 5-step numbered cards explaining the OpenLearn workflow:
 * STEP 01 Choose -> STEP 02 Follow -> STEP 03 Practice -> STEP 04 Track -> STEP 05 Finish.
 */

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { LANDING_DATA } from '@/content/landingData';

export function HowItWorks() {
  const { howItWorks } = LANDING_DATA;

  return (
    <section id="how-it-works" className="py-20 md:py-28 relative">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="badge-bracket mb-4">
            <span>{howItWorks.badge}</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
            {howItWorks.titlePrefix}{' '}
            <em className="font-serif italic font-normal text-accent not-italic">
              {howItWorks.titleEmphasis}
            </em>
          </h2>
          <p className="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
            {howItWorks.subhead}
          </p>
        </div>

        {/* 5-Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {howItWorks.steps.map((step, idx) => {
            const isLast = idx === howItWorks.steps.length - 1;

            return (
              <div
                key={step.number}
                className={`p-7 sm:p-8 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-taste-md group ${
                  isLast ? 'md:col-span-2 lg:col-span-2 bg-[#FFFDFB] border-accent/30' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-xs font-extrabold text-accent bg-accent/8 border border-accent/25 px-3 py-1 rounded-full">
                      {step.number}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-editorial-muted tracking-wider">
                      {step.tag}
                    </span>
                  </div>

                  <h3 className="font-heading text-xl font-bold text-charcoal mb-3">
                    {step.title}
                  </h3>

                  <p className="text-sm sm:text-base text-editorial-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {isLast ? (
                  <div className="mt-6 pt-4 border-t border-accent/20 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-accent">
                      <Sparkles className="w-4 h-4" />
                      <span>CONTINUOUS MASTERY LOOP</span>
                    </div>
                    <a
                      href="#curriculum"
                      className="text-xs font-mono font-bold text-charcoal hover:text-accent flex items-center gap-1"
                    >
                      <span>TEST IT ON A PATH</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="mt-6 pt-4 border-t border-black/6 flex items-center justify-between text-xs font-mono text-editorial-muted">
                    <span>PROGRESSION PHASE 0{idx + 1}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-editorial-subtle group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
