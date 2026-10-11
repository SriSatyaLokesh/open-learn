'use client';

/**
 * @file src/components/landing/HeroSection.tsx
 * @description Hero section with primary value proposition and live workstation mockup.
 * Displays the core headline, dual CTAs, trust badges, and an interactive product preview
 * that allows visitors to switch between concept nodes in a simulated curriculum queue.
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Play,
  RotateCcw,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { LANDING_DATA } from '@/content/landingData';

export function HeroSection() {
  const { hero } = LANDING_DATA;
  const [activeQueueId, setActiveQueueId] = useState('q3');

  const activeItem =
    hero.mockup.queue.find((q) => q.id === activeQueueId) || hero.mockup.queue[2];

  return (
    <section id="hero" className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        {/* Hardware Status Bracket Pill */}
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="badge-bracket flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_#FF5226] animate-sensorBlink" />
            <span>{hero.badge}</span>
          </div>
        </div>

        {/* Display H1 Headline */}
        <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-charcoal max-w-5xl mx-auto leading-[1.12] mb-6">
          {hero.headlinePrefix}{' '}
          <em className="font-serif italic font-normal text-accent not-italic inline-block underline-offset-4">
            {hero.headlineEmphasis}
          </em>
        </h1>

        {/* Subtitle */}
        <p className="font-sans text-lg sm:text-xl text-editorial-secondary max-w-2xl mx-auto leading-relaxed mb-8">
          {hero.subhead}
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-8">
          <a
            href="#curriculum"
            id="cta-hero-primary"
            className="btn btn-primary text-base px-7 py-3.5 shadow-taste-dark-btn group"
          >
            <span>{hero.primaryCta}</span>
            <ArrowRight className="w-4 h-4 text-accent transition-transform duration-200 group-hover:translate-x-1" />
          </a>
          <a
            href="#curriculum"
            id="cta-hero-secondary"
            className="btn btn-secondary text-base px-6 py-3.5"
          >
            <Compass className="w-4 h-4 text-accent" />
            <span>{hero.secondaryCta}</span>
          </a>
        </div>

        {/* Trust Signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm font-medium text-editorial-muted mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-status-emerald" />
            100% Free & Open Source
          </span>
          <span className="text-black/20 hidden sm:inline">•</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-accent" />
            No Credit Card Required
          </span>
          <span className="text-black/20 hidden sm:inline">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            Any Tutorial or Playlist URL
          </span>
        </div>

        {/* Interactive Workspace Showcase Card */}
        <div className="max-w-5xl mx-auto p-2 sm:p-3 bg-white/70 backdrop-blur-md border border-black/8 rounded-2xl sm:rounded-3xl shadow-taste-lg">
          <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-black/6 bg-white text-left">
            {/* Top Workspace Header Bar */}
            <div className="h-10 px-4 bg-page-subtle/80 border-b border-black/6 flex items-center justify-between font-mono text-[11px] sm:text-xs text-editorial-muted">
              <div className="flex items-center gap-2 font-semibold text-charcoal">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="truncate">{hero.mockup.sessionTitle}</span>
              </div>
              <div className="hidden sm:block text-editorial-subtle font-mono">
                {hero.mockup.audioQuality}
              </div>
            </div>

            {/* Split Video Player & Queue Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-12 bg-page-subtle/40">
              {/* Left Video Player Preview Area (Span 8) */}
              <div className="lg:col-span-8 p-4 sm:p-5 flex flex-col gap-3.5">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-charcoal flex items-center justify-center shadow-taste-sm group">
                  {/* Subtle video background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black via-zinc-900 to-stone-900 opacity-95" />

                  {/* Visual concept graphic inside video canvas */}
                  <div className="relative z-10 text-center px-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-mono mb-3 backdrop-blur-sm border border-white/10">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      <span>Active Concept: {activeItem.title}</span>
                    </div>
                    <p className="text-white/80 text-xs sm:text-sm max-w-md mx-auto">
                      Interactive theater environment without recommendation algorithm sidebars.
                    </p>
                  </div>

                  {/* Play Button Pill */}
                  <div className="absolute w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-taste-orange cursor-pointer transition-transform duration-200 group-hover:scale-110">
                    <Play className="w-6 h-6 ml-1 fill-white" />
                  </div>

                  {/* Player Bottom Scrub Bar */}
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white/80 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-status-emerald animate-ping" />
                      <span>08:42 / {activeItem.duration}</span>
                    </div>
                    <span className="badge-bracket text-[10px] bg-white/10 text-white border-white/20">
                      1.0x PLAYBACK
                    </span>
                  </div>
                </div>

                {/* Video Info Strip */}
                <div className="p-3 bg-white border border-black/6 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-taste-sm">
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-charcoal">
                      {activeItem.step}: {activeItem.title}
                    </h3>
                    <p className="text-xs text-editorial-muted">
                      {hero.mockup.activeCourse}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge-bracket text-[10px]">
                      PRACTICE CHECKPOINT READY
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Queue Sidebar Area (Span 4) */}
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-black/6 bg-white p-4 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-charcoal">
                      Learning Curriculum
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-accent bg-accent/8 border border-accent/25 px-2 py-0.5 rounded-full">
                      4 NODES
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {hero.mockup.queue.map((item) => {
                      const isActive = item.id === activeQueueId;
                      const isCompleted = item.status === 'completed';

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveQueueId(item.id)}
                          className={`w-full p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all duration-150 ${
                            isActive
                              ? 'bg-[#FFF9F7] border-accent shadow-sm'
                              : 'bg-page/50 border-black/6 hover:bg-page hover:border-black/12'
                          }`}
                        >
                          <span
                            className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                              isCompleted
                                ? 'bg-status-emerald/10 text-status-emerald'
                                : isActive
                                ? 'bg-accent/15 text-accent'
                                : 'bg-black/5 text-editorial-muted'
                            }`}
                          >
                            {isCompleted ? <Check className="w-3 h-3 inline" /> : item.step}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs text-charcoal truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-editorial-muted flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              <span>{item.duration}</span>
                              {isActive && (
                                <span className="text-accent font-semibold">• Active Node</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mini Pomodoro Focus Cycle Card */}
                <div className="p-3 bg-page rounded-xl border border-black/6 text-center">
                  <div className="font-mono font-extrabold text-xl text-charcoal">
                    25:00
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-accent">
                    Focus Interval Synchronized
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
