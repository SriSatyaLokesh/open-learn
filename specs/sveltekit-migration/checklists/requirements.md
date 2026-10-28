# REQUIREMENTS CHECKLIST: SPEC-0002

Two gates. **Gate A** is run on the spec before implementation starts. **Gate B** is run on the finished work before the spec is marked `Implemented` (task T055).

---

## Gate A — Spec quality (before implementation)

### Completeness
- [ ] Objective states the user-visible outcome (parity + speed) in one paragraph
- [ ] In-scope and out-of-scope lists are explicit; nothing ambiguous sits between them
- [ ] Every current component appears in the port mapping (§2.2) — 12 sections + 2 layout + layout + page
- [ ] All four stateful components list their state and defaults
- [ ] Data contracts are declared unchanged (§4)

### Testability
- [ ] Every AC names its verification layer (E / A / C / M)
- [ ] Every AC is observable without reading the implementation
- [ ] Every AC maps to at least one task (plan §6)
- [ ] Manual ACs (10, 21) define what evidence must be attached

### Consistency
- [ ] Governing ADRs (0001, 0001b, 0005) are cited; the one known deviation (adapter, OQ-4) is recorded with rationale
- [ ] Versions in the plan match research.md R2
- [ ] SEO values match SPEC-0001 §5 exactly
- [ ] No requirement introduces a visual or copy change

### Open items
- [ ] OQ-1 (shadcn-svelte on Tailwind 3) does not block this spec
- [ ] OQ-2 (Cloudflare secrets) has a fallback verification path
- [ ] OQ-3 (maintainer approval to remove OpenNext) resolved — **blocks merge**
- [ ] OQ-4 (adapter deviation) acknowledged by reviewer

---

## Gate B — Delivery (before status → Implemented)

### Behaviour
- [ ] AC-1 … AC-11 checked, each with a link to the passing test or attached evidence
- [ ] Baseline vs new screenshots attached to the PR (AC-10)

### Toolchain and delivery
- [ ] AC-12 … AC-17 checked; CI run linked
- [ ] `wrangler.json` has no `main`; deployed responses show the `_headers` rules

### Accessibility and performance
- [ ] AC-18 … AC-21 checked; Lighthouse and JS numbers recorded next to baseline

### Documentation
- [ ] AC-22, AC-23 checked
- [ ] SPEC-0001 carries the superseded-structure note
- [ ] Follow-up issue opened for content fixes listed in spec §8

### Hygiene
- [ ] No React, Next.js or OpenNext references remain in `src/`, configs, CI or docs (except historical ADR text)
- [ ] Fresh clone builds and tests green with only `corepack enable && pnpm install`
