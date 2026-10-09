/**
 * @file src/app/page.tsx
 * @description Main OpenLearn Landing Page orchestrator.
 * Sequences the 12 key sections in narrative order:
 * 1. HeroSection - Core positioning & interactive workstation preview
 * 2. ProblemAudit - YouTube attention trap vs. OpenLearn structure
 * 3. SolutionPipeline - Paradigm shift (Content -> Concept -> Practice -> Completion)
 * 4. HowItWorks - 5-step learning workflow
 * 5. DistractionFree - Focus Room features (ad-free player, timer, playlist importer, notes)
 * 6. PathVisualizer - Interactive RAG curriculum tree viewer
 * 7. PracticeDemo - Active recall checkpoint sandbox
 * 8. ProgressHud - Resume frontier, daily streaks & scholar trophies
 * 9. OpenCurriculum - Git-for-knowledge community forking model
 * 10. AudienceSection - Learner persona matrix
 * 11. FaqSection - Question-based semantic accordion
 * 12. BottomCta - High-contrast charcoal conversion card
 */

import React from 'react';
import { HeroSection } from '@/components/sections/HeroSection';
import { ProblemAudit } from '@/components/sections/ProblemAudit';
import { SolutionPipeline } from '@/components/sections/SolutionPipeline';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { DistractionFree } from '@/components/sections/DistractionFree';
import { PathVisualizer } from '@/components/sections/PathVisualizer';
import { PracticeDemo } from '@/components/sections/PracticeDemo';
import { ProgressHud } from '@/components/sections/ProgressHud';
import { OpenCurriculum } from '@/components/sections/OpenCurriculum';
import { AudienceSection } from '@/components/sections/AudienceSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { BottomCta } from '@/components/sections/BottomCta';

export default function HomePage() {
  return (
    <>
      {/* 1. Hero Section with Live Workstation Showcase */}
      <HeroSection />

      {/* 2. The Learning Trap vs. OpenLearn Fix */}
      <ProblemAudit />

      {/* 3. Paradigm Shift Pipeline */}
      <SolutionPipeline />

      {/* 4. 5-Step Workflow */}
      <HowItWorks />

      {/* 5. Distraction-Free Study Sanctuary & Audio Mixer */}
      <DistractionFree />

      {/* 6. Interactive Learning Path Tree Visualizer */}
      <PathVisualizer />

      {/* 7. Active Recall Practice Checkpoint */}
      <PracticeDemo />

      {/* 8. Course Continuity, Daily Streaks & Scholar Badges */}
      <ProgressHud />

      {/* 9. Open Curriculum & Git-Style Forking Layer */}
      <OpenCurriculum />

      {/* 10. Audience Personas */}
      <AudienceSection />

      {/* 11. Frequently Asked Questions (AEO-optimized) */}
      <FaqSection />

      {/* 12. Bottom Conversion CTA Banner */}
      <BottomCta />
    </>
  );
}
