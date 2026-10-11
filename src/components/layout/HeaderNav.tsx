'use client';

/**
 * @file src/components/layout/HeaderNav.tsx
 * @description Floating capsule glass navigation header.
 * Sticky pill layout with frosted glass backdrop blur, brand mark with electric orange Zap,
 * section jump anchors, mobile drawer menu, and primary action CTAs.
 */

import React, { useState } from 'react';
import { Zap, Menu, X, ArrowRight, BookOpen } from 'lucide-react';
import { LANDING_DATA } from '@/content/landingData';

export function HeaderNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { nav } = LANDING_DATA;

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 max-w-7xl mx-auto mb-6">
      <nav
        className="w-full px-5 py-3 bg-white/85 backdrop-blur-md border border-black/8 rounded-full shadow-taste-sm flex items-center justify-between gap-4 transition-all duration-200"
        aria-label="Main Navigation"
      >
        {/* Brand Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 font-heading text-xl font-extrabold text-charcoal tracking-tight group"
        >
          <div className="w-8 h-8 rounded-lg bg-charcoal text-white flex items-center justify-center text-sm shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Zap className="w-4 h-4 text-accent fill-accent" />
          </div>
          <span className="flex items-center">
            Open<em className="font-serif italic font-medium text-accent ml-0.5">Learn</em>
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-7">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-editorial-secondary hover:text-charcoal transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="#curriculum"
            className="btn btn-secondary text-xs sm:text-sm px-4 py-2 text-editorial-secondary hover:text-charcoal"
          >
            <BookOpen className="w-3.5 h-3.5 text-editorial-muted" />
            <span>Explore Paths</span>
          </a>
          <a
            href="#hero"
            className="btn btn-primary text-xs sm:text-sm px-5 py-2 text-white"
          >
            <span>{nav.primaryCta}</span>
            <ArrowRight className="w-3.5 h-3.5 text-accent" />
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-charcoal hover:bg-black/5 rounded-full transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-5 bg-white/95 backdrop-blur-lg border border-black/8 rounded-2xl shadow-taste-md flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-3">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-editorial-secondary hover:text-charcoal py-1 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-black/6 flex flex-col gap-2.5">
            <a
              href="#curriculum"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-secondary w-full text-sm py-2.5 justify-center"
            >
              <BookOpen className="w-4 h-4 text-editorial-muted" />
              <span>Explore Paths</span>
            </a>
            <a
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-primary w-full text-sm py-2.5 justify-center"
            >
              <span>{nav.primaryCta}</span>
              <ArrowRight className="w-4 h-4 text-accent" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
