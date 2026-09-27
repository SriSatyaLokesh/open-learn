# Contributing to OpenLearn

Welcome to the **OpenLearn** community! We are thrilled you're interested in helping us build the open-source curriculum layer for internet knowledge.

OpenLearn is built on a simple conviction: **Anyone should be able to turn internet content into a focused learning journey and help the next learner finish faster.**

Whether you are writing code, curating high-quality learning paths, designing distraction-free interfaces, or reporting bugs, your contributions directly empower learners worldwide.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can You Contribute?](#how-can-you-contribute)
  - [1. Curating Learning Paths](#1-curating-learning-paths)
  - [2. Code & Architecture](#2-code--architecture)
  - [3. UI/UX Design & Accessibility](#3-uiux-design--accessibility)
  - [4. Documentation & Translations](#4-documentation--translations)
- [Reporting Bugs & Suggesting Features](#reporting-bugs--suggesting-features)
- [Git Workflow & Conventions](#git-workflow--conventions)
  - [Branch Naming](#branch-naming)
  - [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Community & Support](#community--support)

---

## Code of Conduct

All contributors and community members are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand our community standards and reporting procedures.

---

## How Can You Contribute?

### 1. Curating Learning Paths
You don't need to write code to make a huge impact on OpenLearn!
- Assemble structured learning paths for complex topics (e.g. *Full-Stack Web Development*, *Deep Learning*, *Distributed Systems*, *Creative Writing*).
- Identify the best primary and alternative explanations for core concepts.
- Submit curriculum suggestions using our **[Curriculum Proposal Template](.github/ISSUE_TEMPLATE/curriculum_proposal.md)**.

### 2. Code & Architecture
We welcome contributions across the stack:
- **Core Focus Room**: Frictionless embedded video controls, keyboard navigation, and responsive study layouts.
- **Timestamped Notes**: Note editor, Markdown parsing, auto-save synchronization, and export tools.
- **Content Ingestion**: Parser pipelines for YouTube playlists, video lists, and public learning URLs.
- **Gamification & Social Engine**: Streaks, XP calculations, study groups, and leaderboards.
- **SEO & Discoverability**: Semantic public pages for paths, categories, and verified credentials.

Before starting work on large technical features, please open an issue or check existing issues to ensure alignment with the [Product Requirements Document (PRD)](docs/OPENLEARN_PRD.md).

### 3. UI/UX Design & Accessibility
- Distraction elimination: Designing interfaces that promote deep focus and flow state.
- Focus Room ergonomics: Note-taking panels, video scaling, and dark/sepia/light study modes.
- Accessibility (a11y): WCAG 2.1 compliance, keyboard-only navigation, and screen reader compatibility.

### 4. Documentation & Translations
- Expanding guides, API contracts, and Architectural Decision Records (ADRs).
- Writing tutorials on creating and forking learning paths.
- Localizing the platform for non-English learners.

---

## Reporting Bugs & Suggesting Features

### Submitting a Bug Report
- Check existing issues to see if the problem has already been reported.
- Use the **[Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)**.
- Include clear reproduction steps, browser/OS environment details, and expected vs. actual behavior.

### Proposing a Feature
- Use the **[Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)**.
- Clearly describe the problem you are trying to solve and how it supports distraction-free learning.
- Keep in mind our core non-goals (e.g., we do not host re-uploaded video files or build algorithmic social feeds).

---

## Git Workflow & Conventions

### Branch Naming
Create descriptive branches originating from `main`:
- `feat/focus-room-shortcuts` — New features
- `fix/youtube-timestamp-sync` — Bug fixes
- `docs/add-ingestion-guide` — Documentation changes
- `curriculum/machine-learning-foundations` — Learning path updates
- `refactor/path-builder-state` — Code refactoring without feature change

### Commit Message Format
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

Common types:
- `feat`: A new user-facing feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting, linting)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Maintenance, dependencies, or repository configuration

**Examples:**
```text
feat(focus-room): add keyboard shortcut to create timestamped note
fix(ingestion): correctly parse youtube short links in pasted text
docs(readme): add comparison matrix with traditional LMS
```

---

## Pull Request Process

1. **Fork the repository** and clone it locally.
2. **Create a new branch** following the branch naming guidelines.
3. **Keep PRs focused**: Address a single issue or feature per pull request.
4. **Link the issue**: Reference the related issue in your PR description (e.g., `Closes #12`).
5. **Fill out the PR Template**: Complete all sections of the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
6. **Code Review**: At least one maintainer review is required before merging. Be receptive to feedback and discussion!

---

## Community & Support

- **Discussions**: Share ideas, showcase learning paths, and ask questions in GitHub Discussions.
- **Issues**: Use GitHub Issues for actionable bugs, feature proposals, and curriculum roadmaps.

Thank you for helping us make self-directed education structured, distraction-free, and truly accessible to everyone! 🚀
