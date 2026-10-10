'use client';

/**
 * @file src/components/landing/SolutionPipeline.tsx
 * @description Linear transformation diagram showing the 5-stage paradigm shift:
 * Scattered Content -> Structured Concepts -> Active Practice -> Tracked Progress -> Verified Completion.
 */

import React from 'react';
import { ArrowRight, Layers, FileText, CheckCircle, Flame, Award } from 'lucide-react';
import { LANDING_DATA } from '@/content/landingData';

export function SolutionPipeline() {
  const { transformation } = LANDING_DATA;

  const icons = [
    <FileText key="1" className="w-5 h-5 text-editorial-secondary" />,
    <Layers key="2" className="w-5 h-5 text-accent" />,
    <CheckCircle key="3" className="w-5 h-5 text-status-emerald" />,
    <Flame key="4" className="w-5 h-5 text-status-amber" />,
    <Award key="5" className="w-5 h-5 text-accent" />,
  ];

  return (
    <section className="py-14 md:py-20 bg-page-subtle/60 border-y border-black/6">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="badge-bracket mb-3">
            <span>{transformation.badge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-charcoal">
            {transformation.headline}
          </h2>
          <p className="font-sans text-sm sm:text-base text-editorial-secondary mt-2">
            {transformation.subhead}
          </p>
        </div>

        {/* Linear Horizontal Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
          {transformation.nodes.map((node, index) => (
            <div
              key={node.step}
              className="p-5 rounded-2xl bg-white border border-black/6 shadow-taste-sm flex flex-col justify-between relative group hover:border-accent/40 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-page flex items-center justify-center">
                    {icons[index]}
                  </div>
                  <span className="font-mono text-xs font-bold text-editorial-muted">
                    {node.step}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-base text-charcoal mb-1">
                  {node.title}
                </h3>
                <p className="text-xs text-editorial-secondary leading-relaxed">
                  {node.desc}
                </p>
              </div>

              {/* Step indicator arrow for desktop */}
              {index < transformation.nodes.length - 1 && (
                <div className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-page border border-black/8 items-center justify-center text-editorial-muted shadow-sm">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
