# SYSTEM SPECIFICATION & ARCHITECTURAL EVOLUTION
## Autonomous GitHub Delivery & Verification Engine (MACO)

> **Intellectual Property & Origin:** Conceived and owned by Satya (@SriSatyaLokesh).  
> **Status:** Architectural Evolution Record (Initial Plan Preserved + Pivot Rationale + New Final Plan).  
> **Target Environments:** Anthropic Claude Code & Google Antigravity (`agentskills.io` standard) + GitHub Actions.  
> **Date:** 28 September 2026.

---

## EXECUTIVE SUMMARY: THE STRATEGIC PIVOT

This document records the complete architectural lifecycle of the **MACO** delivery concept. 

To maintain total transparency and intellectual lineage, this document preserves:
1. **[Section I] The Initial Plan (Plan A — The 5-Agent Adversarial Council)**: The complete multi-agent debate framework, Caveman protocol, and pluggable skill slots.
2. **[Section II] Architectural Audit — Why We Diverted**: The first-principles evaluation revealing why Plan A is over-engineered for real-world production.
3. **[Section III] The New Final Plan (Plan B — The Lean Golden Core)**: The high-leverage, production-grade architecture that captures 100% of the value with 4% of the token cost and zero orchestration bloat.
4. **[Section IV] Comparative Scorecard & Phased Implementation Roadmap**.

---

# SECTION I: THE INITIAL PLAN (PLAN A — THE 5-AGENT COUNCIL)

### 1. Concept Overview
The initial architecture envisioned an adversarial multi-agent system managing the software lifecycle directly on GitHub:
- **Upstream (Intake)**: A **Delivery Manager (DM)** agent conducts an interactive interview with the project lead, passes notes to a **Business Analyst (BA)** agent to write pure business logic and numbered Acceptance Criteria (`AC-1..N`), and publishes the issue via `gh issue create`.
- **Downstream (Verification Quad)**: When a community PR is submitted, four specialized agents (**BA, QA, ARCH, DEV**) debate line-by-line across multiple rounds inside a shared markdown ledger (`.orchestrator/ledgers/US-XXX.md`) using a high-density, token-saving **Caveman Telegraphic Protocol**.
- **Self-Healing & Merge Gate**: Playwright is run headlessly via an ephemeral preview server. If tests fail, the maintainer chooses between `[A] Auto-Fix via DEV agent`, `[F] Post Feedback`, or `[B] Bypass`. Unanimous 4/4 consensus is required before the DM agent approves the PR.

### 2. Plan A Architecture Diagram

```mermaid
flowchart TD
    subgraph Upstream [1. Upstream Intake & Issue Generation]
        Lead[Project Lead] -->|Interview| DM[Delivery Manager Agent]
        DM <-->|Business Logic & ACs| BA[Business Analyst Agent]
        BA -->|Drafts Story + AC-1..N| GHIssue[GitHub Issue via gh CLI]
    end

    subgraph Community [2. Open Source Contribution]
        GHIssue --> Contributor[Community Developer Opens PR]
    end

    subgraph Downstream [3. Downstream Adversarial Quad]
        Contributor --> PR[GitHub Pull Request]
        PR --> Graphify[AST Code Knowledge Graph: Graphify]
        Graphify --> ReviewQuad[Debate Quad: BA, QA, ARCH, DEV]
        ReviewQuad <-->|Caveman Protocol Ledger| Ledger[Story Ledger: US-XXX.md]
        ReviewQuad --> Consensus{4/4 Unanimous Sign-Off?}
        Consensus -- CHALLENGE --> TriageHUD{Terminal Triage: [A] Auto-Fix | [F] Feedback | [B] Bypass}
        TriageHUD -->|Auto-Fix| DEV[DEV Agent Patches]
        Consensus -- 4/4 SIGNED --> FinalDM[DM Final Sign-Off -> Merge Permitted]
    end
```

### 3. Plan A Pluggable Skill Slots
Plan A defined 6 pluggable skill slots compliant with `agentskills.io`:
- `[SLOT 1: Delivery Manager]`: Conversational intake & GitHub CLI wrappers.
- `[SLOT 2: Business Analyst]`: Requirements extraction into numbered `AC-1..N`.
- `[SLOT 3: QA & Playwright Automation]`: Web-first E2E generation with compact reporter.
- `[SLOT 4: System Architect]`: Layer boundaries, zero-cost budget, and RLS validation.
- `[SLOT 5: Minimalist Dev/Patch]`: Standard-library-first code quality & self-healing patches.
- `[SLOT 6: Code Knowledge Graph (Graphify)]`: Incremental Git AST blast radius analyzer.

### 4. Plan A Examples

#### Upstream Interview Example
```text
$ npx maco story
[DM Agent]: What business capability or user outcome are we adding?
[Lead]: In the Focus Room, clicking a note timestamp should jump the video to that exact second.
[DM Agent]: What happens if the network drops while taking notes?
[Lead]: Keep notes saved locally on the device; sync when connection returns.
[BA Agent]: Formulates business logic and creates GitHub Issue with AC-1, AC-2, AC-3.
```

#### Downstream Caveman Ledger Example (`US-042.md`)
```yaml
ROUND: 1 | ACTOR: QA | TARGET: DEV
STATUS: CHALLENGE
PLAYWRIGHT_RUN: npx playwright test tests/e2e/us-042.spec.ts --reporter=compact
RESULT: 3 PASS, 1 FAIL (tests/e2e/us-042.spec.ts:42)
EVIDENCE: await page.getByRole('button', { name: '01:45' }).click() -> seekTo not called.
AC_BREACH: AC-2
ACTION_REQ: DEV fix seekTo binding in FocusRoom.svelte.
```

---

# SECTION II: ARCHITECTURAL FEASIBILITY AUDIT (WHY WE DIVERTED)

A rigorous first-principles evaluation revealed fundamental flaws in Plan A that would make it impractical, fragile, and unadoptable in real-world production.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   WHY PLAN A WAS DIVERTED (PAIN POINTS)                │
│                                                                        │
│   1. Multi-Agent Debate Theater: 4 agents debating burns 40k–60k       │
│      tokens per PR when 1 frontier model does it in a single shot.     │
│   2. Replacing Free Deterministic Tools with Expensive LLMs:           │
│      Bash exit codes (`npm test`) & linters (`tsc`) already catch      │
│      failures for $0 with 100% accuracy.                               │
│   3. High Contributor Friction: External devs get blocked by AI       │
│      agents nitpicking theoretical boundaries.                         │
│   4. Massive Maintainer Plumbing Overhead: Managing ephemeral server   │
│      ports, TUIs, state machines, and AST graphs diverts energy from   │
│      building the actual product (OpenLearn).                          │
└────────────────────────────────────────────────────────────────────────┘
```

### The 5 Architectural Divergence Drivers

1. **Token Inefficiency & Latency**:
   - *Plan A*: Round-robin debates across 4 agents consume 40,000–60,000 tokens ($0.15–$0.40) and take 3–5 minutes per review.
   - *Reality*: A single frontier LLM (Claude 3.7 / Gemini 2.0 Pro) evaluating the diff against the issue in **one pass** achieves superior accuracy in 15 seconds for ~1,500 tokens (a **96% cost reduction**).
2. **Replacing $0 Deterministic Code with Stochastic AI**:
   - Having a "QA Agent" watch Playwright execute and type `STATUS: CHALLENGE` is an unnecessary layer. A 15-line GitHub Actions CI script executes Playwright natively. If exit code != 0, merge is blocked deterministically.
   - Having an "Architect Agent" read code to detect unbudgeted dependencies is inferior to **ESLint / Dependency-Cruiser** and `tsc`, which enforce boundaries in 200ms with zero hallucinations.
3. **The Local CLI Barrier**:
   - Forcing maintainers to checkout PR branches locally, run an interactive CLI with a TUI, and babysit port allocations kills developer adoption. Maintainers review PRs on mobile or directly in the GitHub Web UI.
4. **Agent Deadlock & Circular Debates**:
   - Multi-agent councils frequently suffer from agent bike-shedding (e.g., BA arguing with Architect over whether an offline state is an AC or an architectural constraint), requiring circuit breakers and human intervention.
5. **The Maintainer Energy Trap**:
   - Building and debugging custom multi-agent orchestrator engines, AST graph scrapers, and port lifecycles consumes all development bandwidth away from the primary project.

---

# SECTION III: THE NEW FINAL PLAN (PLAN B — THE LEAN GOLDEN CORE)

Instead of building a brittle 5-agent council, the new plan extracts the **three genuinely high-value innovations (The Golden Core)** into a lightweight, standard-compliant architecture.

```mermaid
flowchart TD
    subgraph Upstream [Piece 1: Lean Upstream Story Skill]
        Lead[Maintainer / Project Lead] -->|/story "Add Focus Notes"| StorySkill[Single-Agent Story Skill\nClaude Code / Antigravity]
        StorySkill -->|3-Question Targeted Intake| StorySkill
        StorySkill -->|Autonomous gh issue create| Issue[GitHub Issue: Pure Business Logic + Numbered AC-1..N]
    end

    subgraph Downstream [Piece 2: Single-Shot GitHub CI & Self-Healer Action]
        Contributor[Contributor Opens PR] --> PR[GitHub Pull Request]
        PR --> CI[GitHub Actions Runner: Standard Headless Playwright]
        
        CI -- Passes (Exit 0) --> FastTrack[Fast-Track: AI One-Pass AC Audit -> PR Approved]
        CI -- Fails (Exit 1) --> SelfHeal[Single-Shot AI Self-Healer Action]
        
        SelfHeal -->|Inputs: Failure Trace + Git Diff + Issue ACs| PatchGen[Generates Targeted Minimal Patch]
        PatchGen --> PRComment[Posts 1-Click Patch Suggestion to PR or Pushes fix/ branch]
    end
```

### The 3 Pillars of the Lean Architecture

#### 1. Piece 1: Upstream `/story` Intake Skill (Interactive CLI)
- **What It Is**: A lightweight skill compliant with `agentskills.io` installable in **both Claude Code and Antigravity**.
- **How It Works**:
  - Maintainer invokes: `/story "Implement Focus Room timestamped notes"`.
  - The skill asks **exactly 3 clarifying questions** (Outcome, Edge Cases, Data Boundaries).
  - It strips all technical jargon and formats a pristine GitHub Issue with numbered Acceptance Criteria (`AC-1..N`).
  - Publishes directly using `gh issue create`.
- **Cost**: ~800 tokens. **Dependencies**: Zero custom infrastructure.

#### 2. Piece 2: Deterministic Playwright CI (GitHub Actions)
- **What It Is**: Standard, headless Playwright execution inside `.github/workflows/e2e.yml`.
- **How It Works**:
  - Runs in the cloud on every PR trigger.
  - Generates HTML reports and video artifacts on failure automatically.
  - Zero token cost. Deterministic pass/fail gating.

#### 3. Piece 3: Single-Shot Self-Healing Action (AI on Failure Only)
- **What It Is**: An automated GitHub Action triggered **only when Playwright or linting fails**.
- **How It Works**:
  - Ingests only three inputs:
    1. The failing Playwright assertion trace (last 20 lines).
    2. The PR `git diff`.
    3. The linked issue's Acceptance Criteria.
  - Runs a **single frontier model call** to diagnose the root cause and generate a minimal git patch.
  - Automatically posts a 1-click commit suggestion on the PR:
    ```markdown
    ### ⚠️ Playwright Test Failed on AC-2
    **Failing Test**: `tests/e2e/focus-notes.spec.ts:42` (seekTo not called on timestamp click).
    **AI Suggested Fix**:
    ```suggestion
    function handleTimestampClick(time) {
      player.seekTo(time, true);
    }
    ```
    *(Click 'Commit suggestion' to apply directly).*
    ```

---

# SECTION IV: COMPARATIVE SCORECARD & IMPLEMENTATION ROADMAP

### Architectural Comparison

| Dimension | Plan A (5-Agent Council) | Plan B (Lean Golden Core) | Winner & Why |
|---|---|---|---|
| **Token Cost per PR** | 40,000 – 60,000 tokens ($0.20 – $0.50) | ~1,500 tokens (only on test failure) | **Plan B (96% savings)** |
| **Review Latency** | 3 – 5 minutes (multi-round debate) | 15 – 30 seconds | **Plan B (Instant feedback)** |
| **Code to Maintain** | ~3,000 lines (CLI, TUI, state machine, port manager) | ~200 lines (1 skill file + 1 GitHub Action YAML) | **Plan B (Minimal tech debt)** |
| **Setup Friction** | High (Install Node CLI, local Playwright browsers, port config) | Zero (Runs in standard GitHub repo / CI) | **Plan B (1-click fork/install)** |
| **Reliability** | Moderate (Risk of agent deadlocks & stochastic failures) | High (Deterministic test gate + AI self-healing) | **Plan B (Zero hallucination risk)** |

---

### Step-by-Step Implementation Roadmap for Plan B

```text
PHASE 1: Upstream /story Skill (Claude Code & Antigravity)
├── Author .agents/skills/story-intake/SKILL.md (agentskills.io format)
├── Implement 3-question conversational requirement extraction prompt
├── Add automated gh issue create template enforcing numbered AC-1..N
└── Symlink into .claude/skills/ for Claude Code dual-compatibility

PHASE 2: Deterministic Playwright CI Pipeline
├── Setup tests/e2e/ structure with Web-First Playwright standards
├── Configure .github/workflows/e2e.yml with headless browser execution
└── Enable automatic failure video/trace artifact uploads to GitHub Actions

PHASE 3: Single-Shot Self-Healing GitHub Action
├── Create .github/workflows/self-heal.yml triggered on workflow_run failure
├── Extract Playwright failure trace + git diff
├── Execute single-shot model prompt to synthesize git patch
└── Output interactive 1-click GitHub PR review suggestion comment
```

---

## FINAL ARCHITECTURAL VERDICT

By keeping **Plan A** preserved as our foundational reference and adopting **Plan B** as our execution plan:
1. We preserve the original creative vision of structured delivery and empirical verification.
2. We eliminate thousands of lines of fragile multi-agent orchestration plumbing.
3. We reduce token costs by **96%**, run tests deterministically for **$0**, and provide human maintainers and community contributors with instant 1-click self-healing PRs.
