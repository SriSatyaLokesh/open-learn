# OpenLearn Specifications (Specs)

This directory houses the formal, spec-driven engineering and product specifications for the OpenLearn project.

## Spec-Driven Development at OpenLearn

OpenLearn follows a **Spec-Driven Development (SDD)** lifecycle:

1. **Strategic Intent**: Broad product vision and long-term milestones live in [`docs/OPENLEARN_PRD.md`](../docs/OPENLEARN_PRD.md).
2. **Architectural Foundations**: Irreversible technical trade-offs live in [`docs/ADR/`](../docs/ADR/README.md).
3. **Feature Specifications**: Every major feature, vertical slice, or subsystem is governed by a dedicated specification in `specs/`.

```text
PRD (What & Why) ──► ADRs (Technical Decisions) ──► Specs (Feature Blueprints) ──► Code Implementation
```

## Specification Structure

Every specification in this directory follows a standard structure:

| Section | Description |
|---|---|
| **1. Metadata & Status** | Document author, target release, target route/subsystem, status (`Draft`, `Review`, `Approved`, `Implemented`). |
| **2. Objective & Scope** | Specific problem statement and boundaries of the feature. |
| **3. Information Architecture** | Narrative flow, component breakdown, and wireframe sequence. |
| **4. Data Contracts & Schemas** | TypeScript interfaces, API schemas, and mock contracts. |
| **5. Design Tokens & Accessibility** | Theme tokens, typography, motion constraints, and WCAG AA guidelines. |
| **6. SEO / AEO / GEO Specifications** | Search metadata, Answer Engine Optimization, and Open Graph contracts. |
| **7. Acceptance Criteria (ACs)** | Explicit, numbered, testable acceptance criteria (`AC-1..N`). |

## Active Specifications & Engineering Blueprints

| Specification | ID | Scope | Target Route | Status |
|---|---|---|---|---|
| [`landing-page.spec.md`](./landing-page.spec.md) | `SPEC-0001` | Public landing page, narrative flow, interactive preview sandboxes, and SEO/AEO metadata | `/` | `Implemented` |
| [`focus-room-phase1.spec.md`](./focus-room-phase1.spec.md) | `SPEC-0002` | Phase 1 Foundation: Distraction-Free Focus Room, YouTube IFrame engine, URL/playlist parser, timestamped notes & guest persistence | `/room` | `Ready for Implementation` |
| [`multi-agent-orchestrator.spec.md`](./multi-agent-orchestrator.spec.md) | `SYS-0001` | Autonomous GitHub delivery and verification engine (MACO) | CI/CD & GitHub Actions | `Architecture Record` |
| [`landing-page-plan.md`](./landing-page-plan.md) | `PLAN-0001` | Original 12-section product positioning, messaging audit, and UX strategy | `/` | `Archived Reference` |

