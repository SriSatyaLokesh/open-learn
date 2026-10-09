'use client';

/**
 * @file src/components/sections/AudienceSection.tsx
 * @description Learner persona matrix.
 * Articulates specific friction points and tailored outcomes for:
 * 1. Self-Taught Developers, 2. STEM Students, 3. Career Switchers, 4. Lifelong Polymaths.
 */

import React from 'react';
import { Terminal, GraduationCap, Compass, Lightbulb } from 'lucide-react';
import { LANDING_DATA } from '@/content/landingData';

export function AudienceSection() {
  const { personas } = LANDING_DATA;

  const icons = [
    <Terminal key="1" className="w-5 h-5 text-accent" />,
    <GraduationCap key="2" className="w-5 h-5 text-status-amber" />,
    <Compass key="3" className="w-5 h-5 text-status-emerald" />,
    <Lightbulb key="4" className="w-5 h-5 text-accent" />,
  ];

  return (
    <section className="py-20 md:py-28 relative">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="badge-bracket mb-4">
            <span>WHO IT’S FOR</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
            Built for people who learn from the{' '}
            <em className="font-serif italic font-normal text-accent not-italic">
              open web.
            </em>
          </h2>
          <p className="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
            If you learn online but struggle to stay organized, avoid rabbit holes, and finish what you start, OpenLearn gives you structure.
          </p>
        </div>

        {/* 4 Persona Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {personas.map((persona, idx) => (
            <div
              key={persona.role}
              className="p-6 sm:p-7 rounded-2xl bg-white border border-black/8 shadow-taste-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-taste-md group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-page border border-black/6 flex items-center justify-center">
                    {icons[idx]}
                  </div>
                  <span className="font-mono text-[10px] font-bold text-editorial-muted tracking-wider">
                    {persona.badge}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-lg text-charcoal mb-3">
                  {persona.role}
                </h3>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="text-editorial-muted">
                    <strong className="text-editorial-secondary font-semibold">The Friction: </strong>
                    <span>{persona.problem}</span>
                  </div>
                  <div className="text-editorial-secondary">
                    <strong className="text-charcoal font-semibold">The Fix: </strong>
                    <span>{persona.outcome}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-black/6 flex items-center justify-between text-[11px] font-mono text-editorial-muted">
                <span>TAILORED PATHWAYS</span>
                <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
