/**
 * @file src/types/landing.ts
 * @description Strongly-typed domain and data contracts for the OpenLearn Landing Page.
 * Decouples types from presentation components and static content sets.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface TrustSignal {
  label: string;
  icon: string;
}

export interface MockupQueueItem {
  id: string;
  step: string;
  title: string;
  status: 'completed' | 'active' | 'queued';
  duration: string;
}

export interface HeroMockup {
  sessionTitle: string;
  audioQuality: string;
  activeCourse: string;
  activeVideoTitle: string;
  activeCreator: string;
  progressPercent: number;
  queue: MockupQueueItem[];
}

export interface ProblemComparisonItem {
  title: string;
  description: string;
}

export interface TransformationNode {
  step: string;
  title: string;
  desc: string;
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
  tag: string;
}

export interface DistractionFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface PathNode {
  id: string;
  stepNumber: string;
  title: string;
  creator: string;
  duration: string;
  status: 'completed' | 'active' | 'queued';
  hasPractice: boolean;
  conceptSummary: string;
}

export interface SamplePath {
  title: string;
  category: string;
  nodes: PathNode[];
}

export interface PracticeQuestion {
  id: string;
  concept: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface OpenLearningPrinciple {
  step: string;
  title: string;
  desc: string;
}

export interface PersonaItem {
  role: string;
  problem: string;
  outcome: string;
  badge: string;
}

export interface FaqItem {
  id: string;
  question: string;
  directAnswer: string;
  detailedAnswer: string;
}

export interface FooterLinks {
  product: NavLink[];
  community: NavLink[];
  legal: NavLink[];
}

export interface LandingDataContract {
  nav: {
    brandName: string;
    brandTag: string;
    links: NavLink[];
    primaryCta: string;
    secondaryCta: string;
  };
  hero: {
    badge: string;
    eyebrow: string;
    headlinePrefix: string;
    headlineEmphasis: string;
    subhead: string;
    primaryCta: string;
    secondaryCta: string;
    trustSignals: TrustSignal[];
    mockup: HeroMockup;
  };
  audit: {
    badge: string;
    titlePrefix: string;
    titleEmphasis: string;
    subhead: string;
    youtubePainPoints: ProblemComparisonItem[];
    openLearnSolutions: ProblemComparisonItem[];
  };
  transformation: {
    badge: string;
    headline: string;
    subhead: string;
    nodes: TransformationNode[];
  };
  howItWorks: {
    badge: string;
    titlePrefix: string;
    titleEmphasis: string;
    subhead: string;
    steps: StepItem[];
  };
  distractionFree: {
    badge: string;
    titlePrefix: string;
    titleEmphasis: string;
    subhead: string;
    features: DistractionFeature[];
  };
  curriculumVisualizer: {
    badge: string;
    titlePrefix: string;
    titleEmphasis: string;
    subhead: string;
    samplePath: SamplePath;
  };
  practice: {
    badge: string;
    titlePrefix: string;
    titleEmphasis: string;
    subhead: string;
    sampleQuestions: PracticeQuestion[];
  };
  openLearning: {
    badge: string;
    titlePrefix: string;
    titleEmphasis: string;
    subhead: string;
    principles: OpenLearningPrinciple[];
  };
  personas: PersonaItem[];
  faq: FaqItem[];
  bottomCta: {
    headlinePrefix: string;
    headlineEmphasis: string;
    subhead: string;
    primaryCta: string;
    secondaryCta: string;
    metaNote: string;
  };
  footer: {
    tagline: string;
    copyright: string;
    links: FooterLinks;
  };
}
