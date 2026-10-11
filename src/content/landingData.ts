/**
 * @file src/content/landingData.ts
 * @description Strongly-typed static content data contract for OpenLearn landing page.
 * Keeps copy, comparison points, curriculum trees, practice questions, and personas
 * decoupled from presentation components, enabling easy updates and future MDX migrations.
 */

import type {
  NavLink,
  ProblemComparisonItem,
  StepItem,
  PathNode,
  FaqItem,
  PersonaItem,
  LandingDataContract,
} from '@/types';

export type {
  NavLink,
  ProblemComparisonItem,
  StepItem,
  PathNode,
  FaqItem,
  PersonaItem,
  LandingDataContract,
};

export const LANDING_DATA: LandingDataContract = {
  nav: {
    brandName: 'OpenLearn',
    brandTag: 'v1.0 // OPEN CURRICULUM',
    links: [
      { label: 'The Problem', href: '#problem' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Curricula', href: '#curriculum' },
      { label: 'Practice', href: '#practice' },
      { label: 'FAQ', href: '#faq' },
    ] as NavLink[],
    primaryCta: 'Start Learning',
    secondaryCta: 'Explore Paths',
  },

  hero: {
    badge: 'v1.0 // OPEN CURRICULUM LAYER FOR THE INTERNET',
    eyebrow: 'Open learning, structured for completion',
    headlinePrefix: 'Turn the content you find online into learning you can',
    headlineEmphasis: 'actually finish.',
    subhead:
      'Learn from YouTube and the open web without getting lost in endless playlists, recommendations, and distractions. Follow structured concept paths, practice actively, track your progress, and finish what you start.',
    primaryCta: 'Start Learning',
    secondaryCta: 'Explore Learning Paths',
    trustSignals: [
      { label: '100% Free & Open Source', icon: 'check' },
      { label: 'No Credit Card Required', icon: 'shield' },
      { label: 'Any Tutorial or Playlist URL', icon: 'youtube' },
    ],
    mockup: {
      sessionTitle: 'OPENLEARN WORKSPACE // ACTIVE PATH: FOUNDATIONS OF RAG',
      audioQuality: '[STREAM 1080P] • [FOCUS MODE ACTIVE]',
      activeCourse: 'Retrieval-Augmented Generation (RAG) Architecture',
      activeVideoTitle: 'Step 3 of 6: Chunking Strategies, Overlap & Semantic Splitting',
      activeCreator: 'DeepLearning.AI • 24 mins',
      progressPercent: 48,
      queue: [
        {
          id: 'q1',
          step: '#1',
          title: 'LLM Limits & Hallucinations',
          status: 'completed',
          duration: '18m',
        },
        {
          id: 'q2',
          step: '#2',
          title: 'Vector Spaces & Embeddings',
          status: 'completed',
          duration: '32m',
        },
        {
          id: 'q3',
          step: '#3',
          title: 'Chunking Strategies & Overlap',
          status: 'active',
          duration: '24m',
        },
        {
          id: 'q4',
          step: '#4',
          title: 'Vector DBs & Cosine Search',
          status: 'queued',
          duration: '28m',
        },
      ],
    },
  },

  audit: {
    badge: 'THE PROBLEM VS THE FIX',
    titlePrefix: 'The internet has everything you need to learn.',
    titleEmphasis: 'It just isn’t organized for learning.',
    subhead:
      'YouTube holds the greatest lecture halls and coding tutorials in human history. But its algorithms are engineered to capture your attention — not help you complete a syllabus.',
    youtubePainPoints: [
      {
        title: 'Algorithmic Rabbit Holes',
        description: 'High-dopamine recommendation sidebars and shorts actively engineered to disrupt deep focus.',
      },
      {
        title: 'Passive Video Bingeing',
        description: 'Hours spent watching videos with zero checkpoints, active recall, or practice exercises.',
      },
      {
        title: 'Playlists Are Not Curricula',
        description: 'A single creator rarely explains every topic best, and playlists cannot model prerequisites.',
      },
      {
        title: 'Lost Progress & Abandonment',
        description: 'Bookmarks get buried, tabs accumulate, and 97% of self-directed online learners never finish.',
      },
    ] as ProblemComparisonItem[],
    openLearnSolutions: [
      {
        title: 'Zero Algorithmic Noise',
        description: 'A clean theater environment dedicated solely to your active lesson. No sidebars, no comments.',
      },
      {
        title: 'Learn Concepts by Doing',
        description: 'Interactive checkpoints, recall flashcards, and coding challenges reinforce each concept.',
      },
      {
        title: 'Curated Multi-Creator Paths',
        description: 'The best explanation for each specific sub-concept, structured into a coherent progression.',
      },
      {
        title: 'Always Know Where You Stand',
        description: 'Resume learning in one click. Clear progress percentages and tangible completion milestones.',
      },
    ] as ProblemComparisonItem[],
  },

  transformation: {
    badge: 'PARADIGM SHIFT',
    headline: 'Content → Structured Learning',
    subhead: 'OpenLearn takes scattered video assets and turns them into a structured progression.',
    nodes: [
      { step: '01', title: 'Scattered Content', desc: 'Raw YouTube videos, articles & docs' },
      { step: '02', title: 'Structured Concepts', desc: 'Prerequisite trees & learning roadmaps' },
      { step: '03', title: 'Active Practice', desc: 'Checkpoints & practical exercises' },
      { step: '04', title: 'Tracked Progress', desc: 'Stateful memory & daily focus streaks' },
      { step: '05', title: 'Verified Completion', desc: 'Recognized finish milestone' },
    ],
  },

  howItWorks: {
    badge: 'THE WORKFLOW',
    titlePrefix: 'Five simple steps from scattered curiosity to',
    titleEmphasis: 'finished skill.',
    subhead: 'No extensions to install. No subscription barriers. Just structured learning.',
    steps: [
      {
        number: 'STEP 01',
        title: 'Choose What to Learn',
        description: 'Pick a community-curated learning path or import any YouTube playlist or topic URL.',
        tag: 'SELECT / IMPORT',
      },
      {
        number: 'STEP 02',
        title: 'Follow the Concept Path',
        description: 'Work through modular concepts sequenced by natural prerequisites, not random algorithm feeds.',
        tag: 'SEQUENCE',
      },
      {
        number: 'STEP 03',
        title: 'Practice What You Watch',
        description: 'Complete interactive checkpoints and coding drills right after key conceptual milestones.',
        tag: 'REINFORCE',
      },
      {
        number: 'STEP 04',
        title: 'Track Real Momentum',
        description: 'OpenLearn remembers exactly where you stopped. Resume anytime with zero context lost.',
        tag: 'PROGRESS',
      },
      {
        number: 'STEP 05',
        title: 'Finish What You Started',
        description: 'Complete all required modules, unlock your scholar milestone, and review your timestamped notes.',
        tag: 'COMPLETE',
      },
    ] as StepItem[],
  },

  distractionFree: {
    badge: 'FOCUS WORKSPACE',
    titlePrefix: 'Learn from the content you already use —',
    titleEmphasis: 'without the rabbit hole.',
    subhead: 'A purposeful desktop study sanctuary designed for continuous cognitive flow.',
    features: [
      {
        icon: 'theater',
        title: 'Zero Recommendation Sidebars',
        desc: 'Watch tutorials in an ad-stripped, comment-free player canvas.',
      },
      {
        icon: 'notes',
        title: 'Timestamped Note-Taking',
        desc: 'Jot down insights with one keystroke; click any note to rewind to that exact timestamp.',
      },
      {
        icon: 'import',
        title: 'Smart Playlist & URL Importer',
        desc: 'Paste any YouTube playlist or tutorial link to instantly generate an organized, structured syllabus.',
      },
      {
        icon: 'timer',
        title: 'Synchronized Pomodoro Cycles',
        desc: '25-minute sprints and 5-minute restorative breaks with gentle auditory bells.',
      },
    ],
  },

  curriculumVisualizer: {
    badge: 'CONCEPT-BASED LEARNING',
    titlePrefix: 'Learn concepts, not',
    titleEmphasis: 'random videos.',
    subhead: 'A playlist tells you what to watch. A learning path tells you what to master next.',
    samplePath: {
      title: 'Path: Foundations of Retrieval-Augmented Generation (RAG)',
      category: 'AI Engineering • 6 Modules • ~3.5 Hours',
      nodes: [
        {
          id: 'n1',
          stepNumber: '01',
          title: 'LLM Core Limitations & Hallucinations',
          creator: 'Andrej Karpathy',
          duration: '22m',
          status: 'completed',
          hasPractice: true,
          conceptSummary: 'Context windows, parametric vs non-parametric memory, knowledge cutoffs.',
        },
        {
          id: 'n2',
          stepNumber: '02',
          title: 'Dense Vectors, Embeddings & Semantic Search',
          creator: '3Blue1Brown & Cohere',
          duration: '35m',
          status: 'completed',
          hasPractice: true,
          conceptSummary: 'High-dimensional spaces, cosine similarity, text-embedding models.',
        },
        {
          id: 'n3',
          stepNumber: '03',
          title: 'Chunking Strategies & Overlap Boundaries',
          creator: 'DeepLearning.AI',
          duration: '26m',
          status: 'active',
          hasPractice: true,
          conceptSummary: 'Fixed-size vs markdown recursive splitting, preserving contextual chunks.',
        },
        {
          id: 'n4',
          stepNumber: '04',
          title: 'Vector Databases & Approximate Nearest Neighbors',
          creator: 'Pinecone / Weaviate Tech Talks',
          duration: '30m',
          status: 'queued',
          hasPractice: true,
          conceptSummary: 'HNSW indexing, filtering, metadata payloads, latency vs recall tradeoffs.',
        },
        {
          id: 'n5',
          stepNumber: '05',
          title: 'Hybrid Retrieval & Cross-Encoder Reranking',
          creator: 'James Briggs',
          duration: '28m',
          status: 'queued',
          hasPractice: true,
          conceptSummary: 'BM25 sparse + dense retrieval reciprocal rank fusion (RRF), cross-encoder scoring.',
        },
        {
          id: 'n6',
          stepNumber: '06',
          title: 'End-to-End Evaluation & RAG Triad Metrics',
          creator: 'LangChain & TruLens',
          duration: '40m',
          status: 'queued',
          hasPractice: true,
          conceptSummary: 'Context relevance, groundedness, answer relevance testing.',
        },
      ] as PathNode[],
    },
  },

  practice: {
    badge: 'LEARN BY DOING',
    titlePrefix: 'Don’t just watch.',
    titleEmphasis: 'Practice what you learn.',
    subhead: 'Move from passive consumption to active retention with concept reinforcement checkpoints.',
    sampleQuestions: [
      {
        id: 'q1',
        concept: 'Chunking Strategy Checkpoint',
        question: 'When chunking technical markdown documentation with code blocks, which splitter is most effective?',
        options: [
          'Fixed 200-character character-level slicing',
          'RecursiveCharacterTextSplitter with language-aware code separators',
          'Single document per chunk without splitting',
          'Word-count splitting every 50 words',
        ],
        correctIndex: 1,
        explanation: 'RecursiveCharacterTextSplitter respects markdown hierarchy and avoids splitting code syntax in half.',
      },
    ],
  },

  openLearning: {
    badge: 'COMMUNITY & OPEN SOURCE',
    titlePrefix: 'Curricula that can',
    titleEmphasis: 'evolve like code.',
    subhead: 'When you find a better explanation, don’t keep it to yourself. Improve the curriculum for the next learner.',
    principles: [
      {
        step: 'CREATE',
        title: 'Assemble a Path',
        desc: 'Combine the best modular lectures from any creator into a cohesive path.',
      },
      {
        step: 'LEARN',
        title: 'Battle-Test in Flow',
        desc: 'Study through the material, test the practice checkpoints, and note gaps.',
      },
      {
        step: 'FORK & IMPROVE',
        title: 'Git-Style Improvements',
        desc: 'Replace outdated videos with crisper explanations or add new exercises.',
      },
      {
        step: 'SHARE',
        title: 'Help the Next Learner',
        desc: 'Publish your improved path back to the open community catalog.',
      },
    ],
  },

  personas: [
    {
      role: 'Self-Taught Developers',
      problem: 'Stuck in tutorial hell, jumping between 40-hour playlists without finishing.',
      outcome: 'Follow modular concept roadmaps with built-in coding exercises and verified milestones.',
      badge: 'DEV FOCUS',
    },
    {
      role: 'University & STEM Students',
      problem: 'Struggling with dry textbook chapters while YouTube math videos lack structure.',
      outcome: 'Supplement course lectures with structured multi-creator concept paths.',
      badge: 'ACADEMICS',
    },
    {
      role: 'Career Switchers',
      problem: 'Overwhelmed by infinite conflicting opinions on what technologies to learn first.',
      outcome: 'Linear, prerequisite-checked paths that guide step-by-step to completion.',
      badge: 'SWITCHERS',
    },
    {
      role: 'Lifelong Polymaths',
      problem: 'Curious about quantum mechanics, neuroscience, or finance but losing momentum.',
      outcome: 'Focused, distraction-free immersion with timestamped notes and memory retention.',
      badge: 'MASTERY',
    },
  ] as PersonaItem[],

  faq: [
    {
      id: 'faq-1',
      question: 'What is OpenLearn?',
      directAnswer:
        'OpenLearn is an open platform that transforms scattered educational content from YouTube and the open web into structured, actionable learning paths with practice, progress tracking, and completion.',
      detailedAnswer:
        'Rather than leaving you to manually manage playlists, browser tabs, and bookmarks, OpenLearn sequences multi-creator content into bite-sized concepts with active recall checkpoints and distraction-free viewing.',
    },
    {
      id: 'faq-2',
      question: 'How is OpenLearn different from a YouTube playlist?',
      directAnswer:
        'A playlist only dictates what to watch in chronological order, complete with algorithmic distractions and no practice. OpenLearn tells you what to learn next.',
      detailedAnswer:
        'OpenLearn filters out related-video distractions, groups resources into prerequisite concept nodes, incorporates interactive practice exercises, and persists your exact progress so you never have to start over.',
    },
    {
      id: 'faq-3',
      question: 'Is OpenLearn completely free to use?',
      directAnswer:
        'Yes. OpenLearn is 100% free and open source under the MIT license.',
      detailedAnswer:
        'You can browse, create, and complete learning paths without paywalls or credit cards. Our goal is to make high-quality online education structured and accessible to everyone.',
    },
    {
      id: 'faq-4',
      question: 'Can I learn from any YouTube video or playlist on OpenLearn?',
      directAnswer:
        'Yes! You can paste any public or unlisted YouTube video or playlist URL into OpenLearn.',
      detailedAnswer:
        'OpenLearn renders videos using YouTube’s official embedded player while stripping all sidebar suggestions, comments, and algorithm rabbit holes.',
    },
    {
      id: 'faq-5',
      question: 'Does OpenLearn provide exercises and practice checkpoints?',
      directAnswer:
        'Yes. Learning paths include active practice checkpoints such as concept quizzes, flashcard reflections, and coding tasks.',
      detailedAnswer:
        'We believe deep understanding requires active retrieval. Checkpoints are placed at key milestone concepts so you test your knowledge before advancing to the next node.',
    },
    {
      id: 'faq-6',
      question: 'Can I create or customize my own learning paths?',
      directAnswer:
        'Yes. You can create custom learning paths from scratch or fork any existing path in the open library.',
      detailedAnswer:
        'If you find a lecture that explains a concept better, or want to re-order prerequisites for your team or study group, you can fork the path and share the new version.',
    },
  ] as FaqItem[],

  bottomCta: {
    headlinePrefix: 'Ready to finish',
    headlineEmphasis: 'what you started?',
    subhead:
      'Stop losing momentum to the algorithm. Pick a learning path or paste your favorite tutorial, and experience structured online learning today.',
    primaryCta: 'Start Learning Now',
    secondaryCta: 'Explore Open Paths',
    metaNote: 'Free forever • Open source • No credit card required',
  },

  footer: {
    tagline: 'The open curriculum layer for the internet.',
    copyright: '© 2026 OpenLearn. Released under MIT License.',
    links: {
      product: [
        { label: 'Start Learning', href: '#hero' },
        { label: 'Browse Paths', href: '#curriculum' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Practice System', href: '#practice' },
      ],
      community: [
        { label: 'GitHub Repository', href: 'https://github.com/open-learn' },
        { label: 'Contributing Guide', href: 'https://github.com/open-learn/CONTRIBUTING.md' },
        { label: 'Code of Conduct', href: 'https://github.com/open-learn/CODE_OF_CONDUCT.md' },
      ],
      legal: [
        { label: 'MIT License', href: 'https://github.com/open-learn/LICENSE' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
      ],
    },
  },
};
