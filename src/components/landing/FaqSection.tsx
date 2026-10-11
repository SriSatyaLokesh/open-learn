'use client';

/**
 * @file src/components/landing/FaqSection.tsx
 * @description Frequently asked questions using semantic details/summary accordions.
 * Provides clear, direct 1-2 sentence answers followed by detailed technical context
 * covering OpenLearn, YouTube API compliance, costs, and curriculum creation.
 */

import React from 'react';
import { LANDING_DATA } from '@/content/landingData';

export function FaqSection() {
  const { faq } = LANDING_DATA;

  return (
    <section id="faq" className="py-20 md:py-28 bg-page-subtle/50 relative">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <div className="badge-bracket mb-4">
            <span>CLARITY FIRST</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
            Frequently asked{' '}
            <em className="font-serif italic font-normal text-accent not-italic">
              questions.
            </em>
          </h2>
          <p className="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
            Direct, transparent answers about OpenLearn, YouTube integrations, and curriculum forking.
          </p>
        </div>

        {/* Semantic Accordion List */}
        <div className="space-y-4">
          {faq.map((item, idx) => (
            <details
              key={item.id}
              className="group p-6 rounded-2xl bg-white border border-black/8 shadow-taste-sm transition-all duration-200 open:border-accent/30 open:shadow-taste-md"
              open={idx === 0}
            >
              <summary className="font-heading text-lg font-bold text-charcoal cursor-pointer list-none flex items-center justify-between gap-4 select-none">
                <span>{item.question}</span>
                <span className="font-mono text-xl font-semibold text-accent transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="mt-4 pt-4 border-t border-black/6 text-editorial-secondary text-sm sm:text-base leading-relaxed space-y-2">
                <p className="font-semibold text-charcoal">
                  {item.directAnswer}
                </p>
                <p className="text-editorial-secondary text-sm leading-relaxed">
                  {item.detailedAnswer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
