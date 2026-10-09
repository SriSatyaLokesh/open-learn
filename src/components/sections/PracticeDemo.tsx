'use client';

/**
 * @file src/components/sections/PracticeDemo.tsx
 * @description Interactive "Learn by Doing" checkpoint sandbox.
 * Simulates active recall practice drills with instant feedback to prove
 * OpenLearn reinforces retention instead of passive video consumption.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { LANDING_DATA } from '@/content/landingData';

export function PracticeDemo() {
  const { practice } = LANDING_DATA;
  const question = practice.sampleQuestions[0];

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selectedOption === question.correctIndex;

  const handleSelect = (index: number) => {
    if (!submitted) {
      setSelectedOption(index);
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setSubmitted(false);
  };

  return (
    <section id="practice" className="py-20 md:py-28 bg-page-subtle/50 relative">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="badge-bracket mb-4">
            <span>{practice.badge}</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight mb-5">
            {practice.titlePrefix}{' '}
            <em className="font-serif italic font-normal text-accent not-italic">
              {practice.titleEmphasis}
            </em>
          </h2>
          <p className="font-sans text-base sm:text-lg text-editorial-secondary leading-relaxed">
            {practice.subhead}
          </p>
        </div>

        {/* Practice Sandbox Card */}
        <div className="max-w-3xl mx-auto p-6 sm:p-9 rounded-2xl sm:rounded-3xl bg-white border border-black/8 shadow-taste-md">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-black/6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="font-mono text-xs font-bold text-charcoal uppercase tracking-wider">
                {question.concept}
              </span>
            </div>
            <span className="badge-bracket text-[10px]">
              LIVE DEMO
            </span>
          </div>

          {/* Question Text */}
          <h3 className="font-heading text-lg sm:text-xl font-bold text-charcoal mb-6 leading-snug">
            {question.question}
          </h3>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              let optionStyles = 'bg-page/60 border-black/6 hover:bg-page hover:border-black/15 text-charcoal';

              if (submitted) {
                if (idx === question.correctIndex) {
                  optionStyles = 'bg-status-emerald/10 border-status-emerald text-charcoal font-semibold';
                } else if (isSelected) {
                  optionStyles = 'bg-status-rose/10 border-status-rose text-charcoal';
                } else {
                  optionStyles = 'opacity-50 border-black/6 bg-page/30';
                }
              } else if (isSelected) {
                optionStyles = 'bg-[#FFF9F7] border-accent text-accent font-semibold ring-1 ring-accent/30';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all duration-150 text-sm sm:text-base ${optionStyles}`}
                >
                  <span className="font-mono text-xs font-bold w-6 h-6 rounded-full border border-current flex items-center justify-center flex-shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {submitted && idx === question.correctIndex && (
                    <CheckCircle2 className="w-5 h-5 text-status-emerald flex-shrink-0" />
                  )}
                  {submitted && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-status-rose flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Actions */}
          {submitted ? (
            <div className="p-4 rounded-xl bg-page border border-black/6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-mono text-xs font-bold ${isCorrect ? 'text-status-emerald' : 'text-status-rose'}`}>
                  {isCorrect ? 'CORRECT REINFORCEMENT' : 'INCORRECT RETRIEVAL'}
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-mono text-editorial-secondary hover:text-charcoal flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Try Again</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-editorial-secondary leading-relaxed">
                {question.explanation}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-editorial-muted">
                SELECT AN ANSWER TO TEST YOUR RETENTION
              </span>
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={() => setSubmitted(true)}
                className={`btn btn-primary text-xs sm:text-sm px-6 py-2.5 ${
                  selectedOption === null ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <span>Check Answer</span>
                <ArrowRight className="w-3.5 h-3.5 text-accent" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
