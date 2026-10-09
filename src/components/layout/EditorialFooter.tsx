'use client';

/**
 * @file src/components/layout/EditorialFooter.tsx
 * @description Tactile editorial minimalist footer.
 * Features brand identity, MIT open source badge, GitHub repository links,
 * and structured footer navigation matching the TasteSkill design system.
 */

import React from 'react';
import { Zap, Github, Heart } from 'lucide-react';
import { LANDING_DATA } from '@/content/landingData';

export function EditorialFooter() {
  const { footer } = LANDING_DATA;

  return (
    <footer className="pt-16 pb-12 bg-page-subtle/80 border-t border-black/8 text-charcoal">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-black/6">
          {/* Brand Column (Span 2) */}
          <div className="md:col-span-2">
            <a href="#" className="flex items-center gap-2.5 font-heading text-xl font-extrabold text-charcoal mb-3">
              <div className="w-7 h-7 rounded-lg bg-charcoal text-white flex items-center justify-center text-xs shadow-sm">
                <Zap className="w-3.5 h-3.5 text-accent fill-accent" />
              </div>
              <span>
                Open<em className="font-serif italic font-medium text-accent ml-0.5">Learn</em>
              </span>
            </a>
            <p className="font-sans text-sm text-editorial-secondary max-w-sm leading-relaxed mb-4">
              {footer.tagline}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/open-learn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white border border-black/8 flex items-center justify-center text-editorial-secondary hover:text-charcoal hover:border-black/20 shadow-taste-sm transition-all"
                aria-label="OpenLearn GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <span className="font-mono text-xs text-editorial-muted">
                MIT OPEN SOURCE
              </span>
            </div>
          </div>

          {/* Links Column 1: Product */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-charcoal mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm">
              {footer.links.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-editorial-secondary hover:text-accent transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2: Community */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-charcoal mb-4">
              Community
            </h4>
            <ul className="space-y-2.5 text-sm">
              {footer.links.community.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-editorial-secondary hover:text-accent transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3: Legal & Open Code */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-charcoal mb-4">
              Open Governance
            </h4>
            <ul className="space-y-2.5 text-sm">
              {footer.links.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-editorial-secondary hover:text-accent transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-editorial-muted">
          <div>{footer.copyright}</div>
          <div className="flex items-center gap-1">
            <span>Built with Tactile Editorial Modernism for deep learners</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
